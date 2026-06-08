"""
Advance Service — Emergency salary advance credit lifecycle.

Business rules:
    1. Employees can only request up to 50% of their monthly net salary
    2. Only ONE pending/approved advance allowed at a time per employee
    3. Fee is 2.5% flat (configurable per company in future)
    4. Once approved + disbursed, it's auto-deducted from next payroll run
       (the deduction logic lives in payroll_service during preview)
"""

import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.advance import AdvanceRequest, AdvanceStatus
from app.models.employee import Employee
from app.services.kora_service import KoraService, KoraTransfer
from app.services.tax_engine import get_tax_calculator

logger = logging.getLogger(__name__)


class AdvanceService:
    """Handles advance request lifecycle: create → approve → disburse."""

    def __init__(self):
        self.kora = KoraService()

    async def create_request(
        self,
        db: AsyncSession,
        employee_id: uuid.UUID,
        amount: float,
        currency: str,
        reason: str,
        description: str | None = None,
    ) -> AdvanceRequest:
        """Employee requests a salary advance."""

        # Fetch employee for eligibility check
        employee = await db.get(Employee, employee_id)
        if not employee:
            raise ValueError("Employee not found")

        # Rule 1: Max 50% of estimated net salary
        calculator = get_tax_calculator(employee.country)
        breakdown = calculator.calculate(employee.gross_salary)
        max_advance = breakdown.net_salary * Decimal("0.50")

        requested = Decimal(str(amount))
        if requested > max_advance:
            raise ValueError(
                f"Requested amount ({amount}) exceeds 50% of net salary "
                f"({float(max_advance):.2f})"
            )

        # Rule 2: No outstanding advances
        existing = await db.execute(
            select(AdvanceRequest).where(
                AdvanceRequest.employee_id == employee_id,
                AdvanceRequest.status.in_([
                    AdvanceStatus.pending,
                    AdvanceStatus.approved,
                ]),
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(
                "You already have a pending or approved advance. "
                "Please wait for it to be resolved."
            )

        advance = AdvanceRequest(
            employee_id=employee_id,
            amount=requested,
            currency=currency,
            reason=reason,
            description=description,
            status=AdvanceStatus.pending,
        )
        db.add(advance)
        await db.flush()
        return advance

    async def approve(
        self,
        db: AsyncSession,
        advance_id: uuid.UUID,
        company_id: uuid.UUID,
        approved_amount: float | None = None,
        employer_note: str | None = None,
    ) -> AdvanceRequest:
        """Employer approves an advance (optionally with partial amount)."""

        advance = await db.get(AdvanceRequest, advance_id)
        if not advance:
            raise ValueError("Advance request not found")

        # Verify this advance belongs to an employee in the employer's company
        employee = await db.get(Employee, advance.employee_id)
        if not employee or employee.company_id != company_id:
            raise ValueError("Advance request not found for your company")

        if advance.status != AdvanceStatus.pending:
            raise ValueError(f"Cannot approve an advance in '{advance.status.value}' status")

        final_amount = Decimal(str(approved_amount)) if approved_amount else advance.amount
        fee = (final_amount * advance.fee_percentage / Decimal("100")).quantize(
            Decimal("0.01")
        )

        advance.status = AdvanceStatus.approved
        advance.approved_amount = final_amount
        advance.fee_amount = fee
        advance.employer_note = employer_note
        advance.resolved_at = datetime.now(timezone.utc)

        await db.flush()
        return advance

    async def reject(
        self,
        db: AsyncSession,
        advance_id: uuid.UUID,
        company_id: uuid.UUID,
        employer_note: str,
    ) -> AdvanceRequest:
        """Employer rejects an advance with a reason."""

        advance = await db.get(AdvanceRequest, advance_id)
        if not advance:
            raise ValueError("Advance request not found")

        employee = await db.get(Employee, advance.employee_id)
        if not employee or employee.company_id != company_id:
            raise ValueError("Advance request not found for your company")

        if advance.status != AdvanceStatus.pending:
            raise ValueError(f"Cannot reject an advance in '{advance.status.value}' status")

        advance.status = AdvanceStatus.rejected
        advance.employer_note = employer_note
        advance.resolved_at = datetime.now(timezone.utc)

        await db.flush()
        return advance

    async def disburse(
        self,
        db: AsyncSession,
        advance_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> AdvanceRequest:
        """Trigger Kora transfer for an approved advance."""

        advance = await db.get(AdvanceRequest, advance_id)
        if not advance:
            raise ValueError("Advance request not found")

        # Load employee with their user record (for the Kora customer email).
        employee = await db.scalar(
            select(Employee)
            .options(selectinload(Employee.user))
            .where(Employee.id == advance.employee_id)
        )
        if not employee or employee.company_id != company_id:
            raise ValueError("Advance request not found for your company")

        if advance.status != AdvanceStatus.approved:
            raise ValueError(
                f"Can only disburse an approved advance (current: {advance.status.value})"
            )

        has_bank = bool(employee.bank_account_number and employee.bank_code)
        has_wallet = bool(employee.mobile_wallet)
        if not has_bank and not has_wallet:
            raise ValueError(
                f"Employee {employee.full_name} has no bank account or mobile wallet"
            )

        # Disburse via Kora (net of fee)
        disburse_amount = advance.approved_amount - advance.fee_amount
        ref = f"solvo_adv_{advance_id.hex[:12]}"

        common = dict(
            reference=ref,
            amount=float(disburse_amount),
            currency=advance.currency,
            account_name=employee.full_name,
            narration=f"Solvo Emergency Advance - {advance.reason}",
            email=employee.user.email if employee.user else "",
        )
        if has_bank:
            transfer = KoraTransfer(
                **common,
                bank_account=employee.bank_account_number,
                bank_code=employee.bank_code,
            )
        else:
            transfer = KoraTransfer(**common, mobile_number=employee.mobile_wallet)

        result = await self.kora.initiate_transfer(transfer)

        if result.status == "failed":
            # Surface Kora's real reason (e.g. invalid account, amount cap).
            raise ValueError(f"Disbursement failed: {result.message}")

        # Accepted (success/processing). Store the reference we sent so the
        # webhook can match it; mark disbursed now. If the async payout later
        # fails, the webhook reverts it to approved.
        advance.kora_transfer_id = result.kora_reference or ref
        advance.status = AdvanceStatus.disbursed
        advance.disbursed_at = datetime.now(timezone.utc)

        await db.flush()
        return advance
