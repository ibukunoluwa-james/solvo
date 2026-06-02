"""
Compliance Router — Tax reports and audit trail.

Employer-only endpoints for regulatory compliance visibility.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_employer
from app.models.user import User
from app.models.payroll import PayrollRun
from app.models.tax_remittance import TaxRemittance
from app.schemas.payroll import PayrollRunResponse, TaxSummaryItem

router = APIRouter(prefix="/api/v1/compliance", tags=["Compliance"])


@router.get("/reports", response_model=list[PayrollRunResponse])
async def list_compliance_reports(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """List all payroll runs that have tax remittance data (completed runs)."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    result = await db.execute(
        select(PayrollRun)
        .where(
            PayrollRun.company_id == company.id,
            PayrollRun.status.in_(["completed", "previewed"]),
        )
        .order_by(PayrollRun.initiated_at.desc())
    )
    runs = result.scalars().all()
    return runs


@router.get("/reports/{run_id}", response_model=list[TaxSummaryItem])
async def get_compliance_report(
    run_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Full tax remittance report for a specific payroll run."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    # Verify run belongs to this company
    run = await db.get(PayrollRun, run_id)
    if not run or run.company_id != company.id:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    result = await db.execute(
        select(TaxRemittance).where(TaxRemittance.payroll_run_id == run_id)
    )
    remittances = result.scalars().all()

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


@router.get("/audit-trail")
async def get_audit_trail(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """
    Full audit trail: all payroll runs with their tax remittance records.
    Ordered by most recent first.
    """
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    result = await db.execute(
        select(PayrollRun)
        .options(selectinload(PayrollRun.tax_remittances))
        .where(PayrollRun.company_id == company.id)
        .order_by(PayrollRun.initiated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    runs = result.scalars().unique().all()

    audit = []
    for run in runs:
        audit.append({
            "run_id": str(run.id),
            "period": f"{run.period_year}-{run.period_month:02d}",
            "status": run.status.value,
            "total_gross": float(run.total_gross),
            "total_net": float(run.total_net),
            "total_tax": float(run.total_tax),
            "employee_count": run.employee_count,
            "initiated_at": run.initiated_at.isoformat() if run.initiated_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "remittances": [
                {
                    "country": r.country,
                    "authority": r.authority,
                    "tax_type": r.tax_type,
                    "amount": float(r.amount),
                    "currency": r.currency,
                    "status": r.status.value,
                    "reference": r.reference,
                }
                for r in run.tax_remittances
            ],
        })

    return {"audit_trail": audit, "total": len(audit)}
