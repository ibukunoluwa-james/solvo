"""
Demo data seeder.

Populates the database with a self-contained demo: one company, an admin
(employer) login, six employees (each with their own login), a completed
payroll run with real tax-engine numbers and statutory remittances, an
upcoming draft run, and three advances in different states.

Idempotent: if any user already exists, seeding is skipped. Controlled by
settings.seed_demo_data — intended for demos only, never a real production DB.

Run automatically from the app lifespan (see app.main), or standalone:

    python -m app.seed
"""

import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.database import async_session_factory
from app.dependencies import hash_password
from app.models.advance import AdvanceRequest, AdvanceStatus
from app.models.company import Company
from app.models.employee import Employee, EmploymentType
from app.models.payroll import (
    PayrollEntry,
    PayrollEntryStatus,
    PayrollRun,
    PayrollRunStatus,
)
from app.models.tax_remittance import RemittanceStatus, TaxRemittance
from app.models.user import User, UserRole
from app.services.tax_engine import get_tax_calculator

logger = logging.getLogger(__name__)

# ── Shared demo password (all logins) ──
DEMO_PASSWORD = "Solvo!Demo123"

ADMIN = {
    "email": "admin@solvo.demo",
    "full_name": "Ada Okafor",
}

COMPANY = {
    "name": "Solvo Demo Ltd",
    "country_of_incorporation": "NG",
    "industry": "Technology",
    "currency": "NGN",
    "kora_wallet_id": "wlt_demo_0001",
}

# email local-part is firstname; the first one is the canonical employee login.
EMPLOYEES = [
    {
        "full_name": "Tunde Bello", "email": "employee@solvo.demo",
        "country": "NG", "currency": "NGN", "employment_type": EmploymentType.full_time,
        "gross_salary": Decimal("850000.00"),
        "bank_account_number": "0123456789", "bank_code": "058", "bank_name": "GTBank",
        "tax_id": "NG-NIN-22118", "pension_id": "PEN1009881",
    },
    {
        "full_name": "Chioma Eze", "email": "chioma@solvo.demo",
        "country": "NG", "currency": "NGN", "employment_type": EmploymentType.full_time,
        "gross_salary": Decimal("1200000.00"),
        "bank_account_number": "2233445566", "bank_code": "044", "bank_name": "Access Bank",
        "tax_id": "NG-NIN-77342", "pension_id": "PEN2204517",
    },
    {
        "full_name": "Ifeanyi Okonkwo", "email": "ifeanyi@solvo.demo",
        "country": "NG", "currency": "NGN", "employment_type": EmploymentType.contractor,
        "gross_salary": Decimal("600000.00"),
        "bank_account_number": "9988776655", "bank_code": "057", "bank_name": "Zenith Bank",
        "tax_id": "NG-NIN-51200", "pension_id": None,
    },
    {
        "full_name": "Wanjiru Kamau", "email": "wanjiru@solvo.demo",
        "country": "KE", "currency": "KES", "employment_type": EmploymentType.full_time,
        "gross_salary": Decimal("320000.00"),
        "mobile_wallet": "+254712345678",
        "tax_id": "KE-KRA-A0098", "pension_id": "NSSF-441922",
    },
    {
        "full_name": "Otieno Odhiambo", "email": "otieno@solvo.demo",
        "country": "KE", "currency": "KES", "employment_type": EmploymentType.full_time,
        "gross_salary": Decimal("180000.00"),
        "mobile_wallet": "+254798765432",
        "tax_id": "KE-KRA-B7741", "pension_id": "NSSF-552033",
    },
    {
        "full_name": "Kwame Mensah", "email": "kwame@solvo.demo",
        "country": "GH", "currency": "GHS", "employment_type": EmploymentType.full_time,
        "gross_salary": Decimal("12000.00"),
        "mobile_wallet": "+233241112222",
        "tax_id": "GH-TIN-P0042", "pension_id": "SSNIT-118273",
    },
]

# Statutory account labels per country (paye / pension / housing-or-health).
REMITTANCE_LABELS = {
    "NG": {"paye": "PAYE", "pension": "Pension", "third": "NHF"},
    "KE": {"paye": "PAYE", "pension": "NSSF", "third": "NHIF"},
    "GH": {"paye": "PAYE", "pension": "SSNIT", "third": None},
}


async def seed() -> bool:
    """Seed demo data if the database is empty. Returns True if it seeded."""
    async with async_session_factory() as session:
        # Idempotency keys on the demo admin specifically (not "any user"), so the
        # demo set is created even on a database that already holds other data.
        existing_admin = await session.scalar(
            select(User).where(User.email == ADMIN["email"])
        )
        if existing_admin:
            logger.info("Seed skipped — demo admin %s already exists.", ADMIN["email"])
            return False

        # ── Admin + company ──
        admin = User(
            email=ADMIN["email"],
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name=ADMIN["full_name"],
            role=UserRole.employer,
        )
        session.add(admin)
        await session.flush()  # assigns admin.id

        company = Company(user_id=admin.id, **COMPANY)
        session.add(company)
        await session.flush()  # assigns company.id

        # ── Employees (user login + profile) ──
        employees: list[Employee] = []
        for spec in EMPLOYEES:
            emp_user = User(
                email=spec["email"],
                hashed_password=hash_password(DEMO_PASSWORD),
                full_name=spec["full_name"],
                role=UserRole.employee,
            )
            session.add(emp_user)
            await session.flush()

            profile = Employee(
                user_id=emp_user.id,
                company_id=company.id,
                full_name=spec["full_name"],
                country=spec["country"],
                currency=spec["currency"],
                employment_type=spec["employment_type"],
                gross_salary=spec["gross_salary"],
                bank_account_number=spec.get("bank_account_number"),
                bank_code=spec.get("bank_code"),
                bank_name=spec.get("bank_name"),
                mobile_wallet=spec.get("mobile_wallet"),
                tax_id=spec.get("tax_id"),
                pension_id=spec.get("pension_id"),
            )
            session.add(profile)
            employees.append(profile)
        await session.flush()  # assign employee ids

        # ── Completed payroll run (May 2026) with real tax-engine math ──
        completed_at = datetime(2026, 5, 28, 9, 30, tzinfo=timezone.utc)
        run = PayrollRun(
            company_id=company.id,
            period_month=5,
            period_year=2026,
            status=PayrollRunStatus.completed,
            kora_batch_id="batch_demo_2026_05",
            notes="May 2026 salary run — fully settled.",
            initiated_at=datetime(2026, 5, 28, 9, 0, tzinfo=timezone.utc),
            completed_at=completed_at,
        )
        session.add(run)
        await session.flush()

        totals = {"gross": Decimal("0"), "net": Decimal("0"),
                  "tax": Decimal("0"), "pension": Decimal("0")}
        # country -> {paye, pension, third, currency}
        by_country: dict[str, dict] = {}

        for idx, profile in enumerate(employees):
            calc = get_tax_calculator(profile.country)
            tb = calc.calculate(profile.gross_salary)

            session.add(PayrollEntry(
                payroll_run_id=run.id,
                employee_id=profile.id,
                gross_salary=tb.gross_salary,
                paye_tax=tb.paye_tax,
                pension_employee=tb.pension_employee,
                pension_employer=tb.pension_employer,
                nhf=tb.nhf,
                other_deductions=tb.other_deductions,
                net_salary=tb.net_salary,
                currency=profile.currency,
                kora_transfer_id=f"trf_demo_{idx + 1:03d}",
                status=PayrollEntryStatus.settled,
            ))

            # Run totals (denormalized; mixed-currency sum is acceptable for the demo).
            totals["gross"] += tb.gross_salary
            totals["net"] += tb.net_salary
            totals["tax"] += tb.paye_tax
            totals["pension"] += tb.pension_employee + tb.pension_employer

            agg = by_country.setdefault(
                profile.country,
                {"paye": Decimal("0"), "pension": Decimal("0"),
                 "third": Decimal("0"), "currency": profile.currency},
            )
            agg["paye"] += tb.paye_tax
            agg["pension"] += tb.pension_employee + tb.pension_employer
            agg["third"] += tb.nhf

        run.total_gross = totals["gross"]
        run.total_net = totals["net"]
        run.total_tax = totals["tax"]
        run.total_pension = totals["pension"]
        run.employee_count = len(employees)

        # ── Tax remittances (one per country per statutory type) ──
        for country, agg in by_country.items():
            labels = REMITTANCE_LABELS[country]
            authority = get_tax_calculator(country).authority_name
            buckets = [
                (labels["paye"], agg["paye"]),
                (labels["pension"], agg["pension"]),
                (labels["third"], agg["third"]),
            ]
            for tax_type, amount in buckets:
                if not tax_type or amount <= 0:
                    continue
                session.add(TaxRemittance(
                    payroll_run_id=run.id,
                    country=country,
                    authority=authority,
                    tax_type=tax_type,
                    amount=amount,
                    currency=agg["currency"],
                    status=RemittanceStatus.remitted,
                    reference=f"{authority}-2026-05-{tax_type}",
                    remitted_at=completed_at,
                ))

        # ── Upcoming draft run (June 2026) ──
        session.add(PayrollRun(
            company_id=company.id,
            period_month=6,
            period_year=2026,
            status=PayrollRunStatus.draft,
            notes="June 2026 — draft, not yet previewed.",
            initiated_at=datetime(2026, 6, 1, 8, 0, tzinfo=timezone.utc),
        ))

        # ── Advances (pending / approved / disbursed) ──
        tunde, chioma, wanjiru = employees[0], employees[1], employees[3]

        # pending — shows on the Overview activity feed
        session.add(AdvanceRequest(
            employee_id=tunde.id,
            amount=Decimal("200000.00"), currency="NGN",
            reason="medical", description="Hospital deposit for a family emergency.",
            status=AdvanceStatus.pending, fee_percentage=Decimal("2.50"),
            requested_at=datetime(2026, 6, 3, 11, 15, tzinfo=timezone.utc),
        ))

        # approved (not yet disbursed)
        approved_amount = Decimal("300000.00")
        session.add(AdvanceRequest(
            employee_id=chioma.id,
            amount=approved_amount, currency="NGN",
            reason="rent", description="Annual rent renewal.",
            status=AdvanceStatus.approved,
            employer_note="Approved in full.",
            approved_amount=approved_amount,
            fee_percentage=Decimal("2.50"),
            fee_amount=(approved_amount * Decimal("0.025")).quantize(Decimal("0.01")),
            requested_at=datetime(2026, 6, 2, 10, 0, tzinfo=timezone.utc),
            resolved_at=datetime(2026, 6, 2, 14, 30, tzinfo=timezone.utc),
        ))

        # disbursed
        disbursed_amount = Decimal("50000.00")
        session.add(AdvanceRequest(
            employee_id=wanjiru.id,
            amount=disbursed_amount, currency="KES",
            reason="emergency", description="Urgent car repair.",
            status=AdvanceStatus.disbursed,
            employer_note="Approved and paid out.",
            approved_amount=disbursed_amount,
            fee_percentage=Decimal("2.50"),
            fee_amount=(disbursed_amount * Decimal("0.025")).quantize(Decimal("0.01")),
            kora_transfer_id="trf_adv_demo_001",
            requested_at=datetime(2026, 5, 20, 9, 0, tzinfo=timezone.utc),
            resolved_at=datetime(2026, 5, 20, 12, 0, tzinfo=timezone.utc),
            disbursed_at=datetime(2026, 5, 20, 12, 5, tzinfo=timezone.utc),
        ))

        await session.commit()

    logger.info(
        "Seeded demo data: company '%s', admin %s, %d employees, 2 payroll runs, 3 advances.",
        COMPANY["name"], ADMIN["email"], len(EMPLOYEES),
    )
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
