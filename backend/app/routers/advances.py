"""
Advances Router — Salary advance request lifecycle.

Employee endpoints: create request, view own advances.
Employer endpoints: list/approve/reject/disburse advances.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_employer, require_employee, get_current_user
from app.models.user import User, UserRole
from app.models.advance import AdvanceRequest, AdvanceStatus
from app.models.employee import Employee
from app.schemas.advance import (
    AdvanceRequestCreate,
    AdvanceApproval,
    AdvanceRejection,
    AdvanceResponse,
    AdvanceListResponse,
)
from app.services.advance_service import AdvanceService

router = APIRouter(prefix="/api/v1/advances", tags=["Advances"])
advance_service = AdvanceService()


@router.post(
    "/",
    response_model=AdvanceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_advance(
    payload: AdvanceRequestCreate,
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db),
):
    """Employee requests a salary advance."""
    if not current_user.employee_profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    try:
        advance = await advance_service.create_request(
            db=db,
            employee_id=current_user.employee_profile.id,
            amount=payload.amount,
            currency=payload.currency,
            reason=payload.reason,
            description=payload.description,
        )
        return await _response_for(db, advance.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=AdvanceListResponse)
async def list_advances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    status_filter: str | None = None,
):
    """
    List advances.
    - Employer: all advances for their company.
    - Employee: their own advances only.
    """
    query = select(AdvanceRequest).options(
        selectinload(AdvanceRequest.employee)
    )
    count_query = select(func.count(AdvanceRequest.id))

    if current_user.role == UserRole.employer:
        company = current_user.company
        if not company:
            raise HTTPException(status_code=404, detail="No company found")
        query = query.join(Employee).where(Employee.company_id == company.id)
        count_query = count_query.join(Employee).where(
            Employee.company_id == company.id
        )
    else:
        if not current_user.employee_profile:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        query = query.where(
            AdvanceRequest.employee_id == current_user.employee_profile.id
        )
        count_query = count_query.where(
            AdvanceRequest.employee_id == current_user.employee_profile.id
        )

    if status_filter:
        try:
            s = AdvanceStatus(status_filter)
            query = query.where(AdvanceRequest.status == s)
            count_query = count_query.where(AdvanceRequest.status == s)
        except ValueError:
            pass

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(
        query.order_by(AdvanceRequest.requested_at.desc())
        .offset(skip)
        .limit(limit)
    )
    advances = result.scalars().all()

    return AdvanceListResponse(
        advances=[_to_response(a) for a in advances],
        total=total,
    )


@router.get("/{advance_id}", response_model=AdvanceResponse)
async def get_advance(
    advance_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get advance detail (employer or the requesting employee)."""
    advance = await db.get(AdvanceRequest, advance_id)
    if not advance:
        raise HTTPException(status_code=404, detail="Advance not found")

    # Authorization check
    if current_user.role == UserRole.employer:
        employee = await db.get(Employee, advance.employee_id)
        if not employee or employee.company_id != current_user.company.id:
            raise HTTPException(status_code=404, detail="Advance not found")
    elif current_user.role == UserRole.employee:
        if not current_user.employee_profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        if advance.employee_id != current_user.employee_profile.id:
            raise HTTPException(status_code=404, detail="Advance not found")

    return await _response_for(db, advance.id)


@router.put("/{advance_id}/approve", response_model=AdvanceResponse)
async def approve_advance(
    advance_id: UUID,
    payload: AdvanceApproval,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Employer approves an advance request."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    try:
        advance = await advance_service.approve(
            db=db,
            advance_id=advance_id,
            company_id=company.id,
            approved_amount=payload.approved_amount,
            employer_note=payload.employer_note,
        )
        return await _response_for(db, advance.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{advance_id}/reject", response_model=AdvanceResponse)
async def reject_advance(
    advance_id: UUID,
    payload: AdvanceRejection,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Employer rejects an advance request."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    try:
        advance = await advance_service.reject(
            db=db,
            advance_id=advance_id,
            company_id=company.id,
            employer_note=payload.employer_note,
        )
        return await _response_for(db, advance.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{advance_id}/disburse", response_model=AdvanceResponse)
async def disburse_advance(
    advance_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Trigger Kora payout for an approved advance."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    try:
        advance = await advance_service.disburse(
            db=db,
            advance_id=advance_id,
            company_id=company.id,
        )
        return await _response_for(db, advance.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


async def _response_for(db: AsyncSession, advance_id: UUID) -> AdvanceResponse:
    """
    Re-load an advance with its employee eager-loaded, then serialize.

    Used by the single-object endpoints. Without the eager load, _to_response
    would touch the lazy `advance.employee` relationship outside the async
    greenlet context and raise MissingGreenlet (500). The list endpoint already
    eager-loads, so it calls _to_response directly.
    """
    advance = await db.scalar(
        select(AdvanceRequest)
        .options(selectinload(AdvanceRequest.employee))
        .where(AdvanceRequest.id == advance_id)
    )
    if not advance:
        raise HTTPException(status_code=404, detail="Advance not found")
    return _to_response(advance)


def _to_response(advance: AdvanceRequest) -> AdvanceResponse:
    """Convert ORM model to response schema. Assumes `employee` is eager-loaded."""
    employee_name = advance.employee.full_name if advance.employee else None

    return AdvanceResponse(
        id=advance.id,
        employee_id=advance.employee_id,
        employee_name=employee_name,
        amount=float(advance.amount),
        currency=advance.currency,
        reason=advance.reason,
        description=advance.description,
        status=advance.status.value,
        employer_note=advance.employer_note,
        approved_amount=float(advance.approved_amount) if advance.approved_amount else None,
        fee_percentage=float(advance.fee_percentage),
        fee_amount=float(advance.fee_amount),
        kora_transfer_id=advance.kora_transfer_id,
        requested_at=advance.requested_at,
        resolved_at=advance.resolved_at,
        disbursed_at=advance.disbursed_at,
    )
