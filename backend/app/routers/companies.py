"""
Companies Router — Employer company profile and dashboard.

All endpoints require employer role.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_employer
from app.models.user import User
from app.models.company import Company
from app.models.employee import Employee
from app.models.payroll import PayrollRun, PayrollRunStatus
from app.models.advance import AdvanceRequest, AdvanceStatus
from app.models.tax_remittance import TaxRemittance, RemittanceStatus
from app.schemas.company import CompanyResponse, CompanyUpdate, DashboardSummary
from app.services.kora_service import KoraService, KoraError

router = APIRouter(prefix="/api/v1/companies", tags=["Companies"])


class FundCard(BaseModel):
    """Card details for a card-funded top-up (Kora encrypts in transit)."""
    number: str
    cvv: str
    expiry_month: str
    expiry_year: str


class FundRequest(BaseModel):
    """
    Top up the company's Kora wallet. With `card`, charges the card (credits
    immediately). Without `card`, returns a virtual bank account to transfer to.
    Kora collection is NGN-only.
    """
    amount: float = Field(gt=0, description="Amount to fund")
    currency: str | None = Field(
        default=None, description="Defaults to the company's currency (NGN)"
    )
    narration: str | None = None
    card: FundCard | None = None


@router.get("/me", response_model=CompanyResponse)
async def get_my_company(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Get the authenticated employer's company profile."""
    if not current_user.company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No company associated with this account",
        )
    return current_user.company


@router.put("/me", response_model=CompanyResponse)
async def update_my_company(
    payload: CompanyUpdate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Update company settings."""
    company = current_user.company
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No company associated with this account",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    await db.flush()
    return company


@router.get("/me/balance")
async def get_balance(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Live funding-source balance from Kora — available + pending balance for the
    company's base currency, plus the full per-currency breakdown.
    """
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    kora = KoraService()
    try:
        balances = await kora.get_balances()
    except KoraError as exc:
        raise HTTPException(
            status_code=502, detail=f"Could not fetch balance from Kora: {exc}"
        )

    base = company.currency or "NGN"
    current = balances.get(base, {})
    return {
        "currency": base,
        "available_balance": current.get("available_balance", 0),
        "pending_balance": current.get("pending_balance", 0),
        "kora_wallet_id": company.kora_wallet_id,
        "balances": balances,
        "mock": kora.mock_mode,
    }


@router.post("/me/fund")
async def fund_company(
    payload: FundRequest,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Fund the company's Kora wallet (pay-in).

    - With `card`: charges the card and credits the balance immediately.
    - Without `card`: returns a virtual bank account to transfer into.
    """
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    currency = (payload.currency or company.currency or "NGN").upper()
    reference = f"solvofund{uuid.uuid4().hex[:14]}"
    narration = payload.narration or "Wallet top-up"
    kora = KoraService()

    try:
        if payload.card:
            result = await kora.charge_card(
                reference=reference,
                amount=payload.amount,
                currency=currency,
                card_number=payload.card.number,
                cvv=payload.card.cvv,
                expiry_month=payload.card.expiry_month,
                expiry_year=payload.card.expiry_year,
                customer_name=company.name,
                customer_email=current_user.email,
            )
            result["method"] = "card"
        else:
            result = await kora.initiate_charge(
                reference=reference,
                amount=payload.amount,
                currency=currency,
                customer_name=company.name,
                customer_email=current_user.email,
                narration=narration,
            )
            result["method"] = "bank_transfer"
    except KoraError as exc:
        raise HTTPException(status_code=502, detail=f"Funding failed: {exc}")

    return result


@router.get("/me/fund/{reference}")
async def fund_status(
    reference: str,
    current_user: User = Depends(require_employer),
):
    """Check the status of a wallet top-up by its reference."""
    try:
        return await KoraService().get_charge_status(reference)
    except KoraError as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch charge: {exc}")


@router.get("/me/dashboard", response_model=DashboardSummary)
async def get_dashboard(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard summary with key metrics."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    company_id = company.id

    # Total employees
    emp_count = await db.execute(
        select(func.count(Employee.id)).where(Employee.company_id == company_id)
    )
    total_employees = emp_count.scalar() or 0

    # Total payroll runs
    run_count = await db.execute(
        select(func.count(PayrollRun.id)).where(
            PayrollRun.company_id == company_id
        )
    )
    total_runs = run_count.scalar() or 0

    # Total disbursed (sum of net from completed runs)
    disbursed = await db.execute(
        select(func.coalesce(func.sum(PayrollRun.total_net), 0)).where(
            PayrollRun.company_id == company_id,
            PayrollRun.status == PayrollRunStatus.completed,
        )
    )
    total_disbursed = float(disbursed.scalar() or 0)

    # Total tax remitted
    tax_result = await db.execute(
        select(func.coalesce(func.sum(TaxRemittance.amount), 0))
        .join(PayrollRun)
        .where(
            PayrollRun.company_id == company_id,
            TaxRemittance.status == RemittanceStatus.remitted,
        )
    )
    total_tax = float(tax_result.scalar() or 0)

    # Pending advances
    adv_result = await db.execute(
        select(func.count(AdvanceRequest.id))
        .join(Employee)
        .where(
            Employee.company_id == company_id,
            AdvanceRequest.status == AdvanceStatus.pending,
        )
    )
    pending_advances = adv_result.scalar() or 0

    # Countries covered
    countries_result = await db.execute(
        select(distinct(Employee.country)).where(
            Employee.company_id == company_id
        )
    )
    countries = [row[0] for row in countries_result.all()]

    # Recent payroll status
    recent = await db.execute(
        select(PayrollRun.status)
        .where(PayrollRun.company_id == company_id)
        .order_by(PayrollRun.initiated_at.desc())
        .limit(1)
    )
    recent_status = recent.scalar()

    return DashboardSummary(
        total_employees=total_employees,
        total_payroll_runs=total_runs,
        total_disbursed=total_disbursed,
        total_tax_remitted=total_tax,
        pending_advances=pending_advances,
        countries_covered=countries,
        recent_payroll_status=recent_status.value if recent_status else None,
    )
