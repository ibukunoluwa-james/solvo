"""
Payroll Router — Create, preview, and execute payroll runs.

All endpoints require employer role.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_employer
from app.models.user import User
from app.models.payroll import PayrollRun, PayrollEntry
from app.models.tax_remittance import TaxRemittance
from app.schemas.payroll import (
    PayrollRunCreate,
    PayrollRunResponse,
    PayrollRunListResponse,
    PayrollEntryResponse,
    PayrollPreviewResponse,
    TaxSummaryItem,
)
from app.services.payroll_service import PayrollService

router = APIRouter(prefix="/api/v1/payroll", tags=["Payroll"])
payroll_service = PayrollService()


@router.post(
    "/runs",
    response_model=PayrollRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_run(
    payload: PayrollRunCreate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Create a new payroll run (draft status)."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    try:
        run = await payroll_service.create_run(
            db=db,
            company_id=company.id,
            period_month=payload.period_month,
            period_year=payload.period_year,
            notes=payload.notes,
        )
        return run
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs", response_model=PayrollRunListResponse)
async def list_runs(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """List all payroll runs for the company."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    count_result = await db.execute(
        select(func.count(PayrollRun.id)).where(
            PayrollRun.company_id == company.id
        )
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(PayrollRun)
        .where(PayrollRun.company_id == company.id)
        .order_by(PayrollRun.initiated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    runs = result.scalars().all()

    return PayrollRunListResponse(runs=runs, total=total)


@router.get("/runs/{run_id}", response_model=PayrollRunResponse)
async def get_run(
    run_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific payroll run's details."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    run = await db.get(PayrollRun, run_id)
    if not run or run.company_id != company.id:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    return run


@router.post("/runs/{run_id}/preview", response_model=PayrollPreviewResponse)
async def preview_run(
    run_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Preview payroll: calculate taxes for all employees.
    Creates entries but does NOT trigger payouts.
    """
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    try:
        run = await payroll_service.preview_run(
            db=db, run_id=run_id, company_id=company.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Fetch entries with employee names
    entries = await payroll_service.get_run_entries(
        db=db, run_id=run_id, company_id=company.id
    )
    entry_responses = [
        PayrollEntryResponse(
            id=e.id,
            employee_id=e.employee_id,
            employee_name=e.employee.full_name if e.employee else None,
            employee_country=e.employee.country if e.employee else None,
            gross_salary=float(e.gross_salary),
            paye_tax=float(e.paye_tax),
            pension_employee=float(e.pension_employee),
            pension_employer=float(e.pension_employer),
            nhf=float(e.nhf),
            other_deductions=float(e.other_deductions),
            net_salary=float(e.net_salary),
            currency=e.currency,
            kora_transfer_id=e.kora_transfer_id,
            status=e.status.value,
        )
        for e in entries
    ]

    # Tax summary
    remittances = await payroll_service.get_tax_summary(
        db=db, run_id=run_id, company_id=company.id
    )
    tax_items = [
        TaxSummaryItem(
            country=r.country,
            authority=r.authority,
            tax_type=r.tax_type,
            total_amount=float(r.amount),
            currency=r.currency,
        )
        for r in remittances
    ]

    return PayrollPreviewResponse(
        run_id=run.id,
        period=f"{run.period_year}-{run.period_month:02d}",
        total_gross=float(run.total_gross),
        total_net=float(run.total_net),
        total_tax=float(run.total_tax),
        total_pension=float(run.total_pension),
        employee_count=run.employee_count,
        entries=entry_responses,
        tax_summary=tax_items,
    )


@router.post("/runs/{run_id}/execute", response_model=PayrollRunResponse)
async def execute_run(
    run_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a previewed payroll run — triggers Kora bulk payout.
    This is irreversible. Money will move.
    """
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    try:
        run = await payroll_service.execute_run(
            db=db, run_id=run_id, company_id=company.id
        )
        return run
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/runs/{run_id}/entries",
    response_model=list[PayrollEntryResponse],
)
async def get_run_entries(
    run_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Get all payslip entries for a payroll run."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    entries = await payroll_service.get_run_entries(
        db=db, run_id=run_id, company_id=company.id
    )
    return [
        PayrollEntryResponse(
            id=e.id,
            employee_id=e.employee_id,
            employee_name=e.employee.full_name if e.employee else None,
            employee_country=e.employee.country if e.employee else None,
            gross_salary=float(e.gross_salary),
            paye_tax=float(e.paye_tax),
            pension_employee=float(e.pension_employee),
            pension_employer=float(e.pension_employer),
            nhf=float(e.nhf),
            other_deductions=float(e.other_deductions),
            net_salary=float(e.net_salary),
            currency=e.currency,
            kora_transfer_id=e.kora_transfer_id,
            status=e.status.value,
        )
        for e in entries
    ]


@router.get(
    "/runs/{run_id}/tax-summary",
    response_model=list[TaxSummaryItem],
)
async def get_tax_summary(
    run_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Tax remittance breakdown for a payroll run."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    remittances = await payroll_service.get_tax_summary(
        db=db, run_id=run_id, company_id=company.id
    )
    return [
        TaxSummaryItem(
            country=r.country,
            authority=r.authority,
            tax_type=r.tax_type,
            total_amount=float(r.amount),
            currency=r.currency,
        )
        for r in remittances
    ]
