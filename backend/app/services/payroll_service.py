"""
Payroll Service — Orchestrates the full payroll run lifecycle.

Flow:
    1. Create run (draft) → stores period and company reference
    2. Preview → calculates taxes for ALL active employees, creates entries
    3. Execute → sends bulk payout via Kora, updates statuses
    4. Status updates → (future: webhook handler updates individual entries)

Design decision: Preview is a separate step from execute so the employer
can review deductions and net amounts BEFORE triggering irreversible payouts.
This is critical for compliance — you want a human sign-off on the numbers.
"""

import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal
from collections import defaultdict

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.employee import Employee
from app.models.payroll import PayrollRun, PayrollEntry, PayrollRunStatus, PayrollEntryStatus
from app.models.tax_remittance import TaxRemittance, RemittanceStatus
from app.services.tax_engine import get_tax_calculator, TaxBreakdown
from app.services.kora_service import KoraService, KoraTransfer

logger = logging.getLogger(__name__)


class PayrollService:
    """Stateless service — takes a db session per operation."""

    def __init__(self):
        self.kora = KoraService()

    async def create_run(
        self,
        db: AsyncSession,
        company_id: uuid.UUID,
        period_month: int,
        period_year: int,
        notes: str | None = None,
    ) -> PayrollRun:
        """Create a new payroll run in draft status."""

        # Guard: no duplicate run for same period
        existing = await db.execute(
            select(PayrollRun).where(
                PayrollRun.company_id == company_id,
                PayrollRun.period_month == period_month,
                PayrollRun.period_year == period_year,
                PayrollRun.status.notin_([PayrollRunStatus.failed]),
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(
                f"Payroll run already exists for {period_year}-{period_month:02d}"
            )

        run = PayrollRun(
            company_id=company_id,
            period_month=period_month,
            period_year=period_year,
            notes=notes,
            status=PayrollRunStatus.draft,
        )
        db.add(run)
        await db.flush()
        return run

    async def preview_run(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> PayrollRun:
        """
        Calculate taxes for all employees and create PayrollEntry + TaxRemittance
        records. Does NOT trigger payouts — just computes the numbers.
        """
        run = await db.get(PayrollRun, run_id)
        if not run or run.company_id != company_id:
            raise ValueError("Payroll run not found")
        if run.status not in (PayrollRunStatus.draft, PayrollRunStatus.previewed):
            raise ValueError(f"Cannot preview a run in '{run.status.value}' status")

        # Clear previous preview entries if re-previewing
        if run.status == PayrollRunStatus.previewed:
            await db.execute(
                PayrollEntry.__table__.delete().where(
                    PayrollEntry.payroll_run_id == run_id
                )
            )
            await db.execute(
                TaxRemittance.__table__.delete().where(
                    TaxRemittance.payroll_run_id == run_id
                )
            )

        # Fetch all active employees for this company
        result = await db.execute(
            select(Employee).where(
                Employee.company_id == company_id,
            )
        )
        employees = result.scalars().all()

        if not employees:
            raise ValueError("No employees found for this company")

        # Calculate taxes and build entries
        total_gross = Decimal("0")
        total_net = Decimal("0")
        total_tax = Decimal("0")
        total_pension = Decimal("0")

        # Aggregate tax remittances by country + type
        tax_aggregates: dict[tuple[str, str], Decimal] = defaultdict(Decimal)

        for emp in employees:
            calculator = get_tax_calculator(emp.country)
            breakdown: TaxBreakdown = calculator.calculate(emp.gross_salary)

            entry = PayrollEntry(
                payroll_run_id=run_id,
                employee_id=emp.id,
                gross_salary=breakdown.gross_salary,
                paye_tax=breakdown.paye_tax,
                pension_employee=breakdown.pension_employee,
                pension_employer=breakdown.pension_employer,
                nhf=breakdown.nhf,
                other_deductions=breakdown.other_deductions,
                net_salary=breakdown.net_salary,
                currency=emp.currency,
                status=PayrollEntryStatus.pending,
            )
            db.add(entry)

            total_gross += breakdown.gross_salary
            total_net += breakdown.net_salary
            total_tax += breakdown.paye_tax
            total_pension += breakdown.pension_employee

            # Aggregate for remittance records
            if breakdown.paye_tax > 0:
                tax_aggregates[(emp.country, "PAYE")] += breakdown.paye_tax
            if breakdown.pension_employee > 0:
                tax_aggregates[(emp.country, "Pension")] += breakdown.pension_employee
            if breakdown.nhf > 0:
                nhf_label = "NHIF" if emp.country == "KE" else "NHF"
                tax_aggregates[(emp.country, nhf_label)] += breakdown.nhf

        # Create TaxRemittance records
        authority_map = {"NG": "FIRS", "KE": "KRA", "GH": "GRA"}
        for (country, tax_type), amount in tax_aggregates.items():
            # Determine currency from first employee in that country
            country_currency = next(
                (e.currency for e in employees if e.country == country), "USD"
            )
            remittance = TaxRemittance(
                payroll_run_id=run_id,
                country=country,
                authority=authority_map.get(country, "N/A"),
                tax_type=tax_type,
                amount=amount,
                currency=country_currency,
                status=RemittanceStatus.pending,
            )
            db.add(remittance)

        # Update run totals
        run.total_gross = total_gross
        run.total_net = total_net
        run.total_tax = total_tax
        run.total_pension = total_pension
        run.employee_count = len(employees)
        run.status = PayrollRunStatus.previewed

        await db.flush()
        return run

    async def execute_run(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> PayrollRun:
        """
        Execute a previewed payroll run — triggers Kora bulk payout.
        This is the point of no return: money moves.
        """
        run = await db.get(PayrollRun, run_id)
        if not run or run.company_id != company_id:
            raise ValueError("Payroll run not found")
        if run.status != PayrollRunStatus.previewed:
            raise ValueError(
                f"Can only execute a previewed run (current: {run.status.value})"
            )

        # Load entries with employee info for banking details
        result = await db.execute(
            select(PayrollEntry)
            .options(selectinload(PayrollEntry.employee))
            .where(PayrollEntry.payroll_run_id == run_id)
        )
        entries = result.scalars().all()

        # Build Kora transfer list
        kora_transfers: list[KoraTransfer] = []
        for entry in entries:
            emp = entry.employee
            if not emp.bank_account_number or not emp.bank_code:
                logger.warning(
                    f"Skipping {emp.full_name}: missing bank details"
                )
                entry.status = PayrollEntryStatus.failed
                continue

            ref = f"solvo_pay_{run_id.hex[:8]}_{emp.id.hex[:8]}"
            kora_transfers.append(KoraTransfer(
                reference=ref,
                amount=float(entry.net_salary),
                currency=entry.currency,
                bank_account=emp.bank_account_number,
                bank_code=emp.bank_code,
                account_name=emp.full_name,
                narration=f"Solvo Payroll {run.period_year}-{run.period_month:02d}",
            ))

        if not kora_transfers:
            raise ValueError("No valid employees to pay (all missing bank details)")

        # Execute bulk payout
        run.status = PayrollRunStatus.processing
        await db.flush()

        try:
            batch_response = await self.kora.initiate_bulk_payout(kora_transfers)
            run.kora_batch_id = batch_response.batch_id

            # Map Kora responses back to entries
            ref_to_entry = {}
            for entry in entries:
                if entry.employee:
                    ref = f"solvo_pay_{run_id.hex[:8]}_{entry.employee_id.hex[:8]}"
                    ref_to_entry[ref] = entry

            for transfer_resp in batch_response.transfers:
                entry = ref_to_entry.get(transfer_resp.reference)
                if entry:
                    entry.kora_transfer_id = transfer_resp.kora_reference
                    if transfer_resp.status in ("success", "completed"):
                        entry.status = PayrollEntryStatus.settled
                    elif transfer_resp.status == "failed":
                        entry.status = PayrollEntryStatus.failed
                    else:
                        entry.status = PayrollEntryStatus.processing

            # Check overall result
            failed_count = sum(
                1 for e in entries if e.status == PayrollEntryStatus.failed
            )
            if failed_count == len(entries):
                run.status = PayrollRunStatus.failed
            else:
                run.status = PayrollRunStatus.completed
                run.completed_at = datetime.now(timezone.utc)

        except Exception as e:
            logger.error(f"Bulk payout failed: {e}")
            run.status = PayrollRunStatus.failed
            for entry in entries:
                entry.status = PayrollEntryStatus.failed
            raise

        await db.flush()
        return run

    async def get_run_entries(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> list[PayrollEntry]:
        """Get all entries for a payroll run with employee details."""
        result = await db.execute(
            select(PayrollEntry)
            .options(selectinload(PayrollEntry.employee))
            .where(PayrollEntry.payroll_run_id == run_id)
            .join(PayrollRun)
            .where(PayrollRun.company_id == company_id)
        )
        return list(result.scalars().all())

    async def get_tax_summary(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> list[TaxRemittance]:
        """Get tax remittance summary for a payroll run."""
        result = await db.execute(
            select(TaxRemittance)
            .where(TaxRemittance.payroll_run_id == run_id)
            .join(PayrollRun)
            .where(PayrollRun.company_id == company_id)
        )
        return list(result.scalars().all())
