"""
Employees Router — CRUD for employees + employee self-serve endpoints.

Employer endpoints: add, list, update, remove employees.
Employee endpoints: view own profile, payslip history.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_employer, require_employee, get_current_user, hash_password
from app.models.user import User, UserRole
from app.models.employee import Employee, EmploymentType
from app.models.payroll import PayrollEntry
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
)
from app.schemas.payroll import PayrollEntryResponse

router = APIRouter(prefix="/api/v1/employees", tags=["Employees"])


# ── Employer Endpoints ──

@router.post(
    "/",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Employer adds a new employee to their company."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    # Check duplicate email
    existing = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user account for the employee
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.employee,
    )
    db.add(user)
    await db.flush()

    emp_type = (
        EmploymentType.contractor
        if payload.employment_type == "contractor"
        else EmploymentType.full_time
    )
    employee = Employee(
        user_id=user.id,
        company_id=company.id,
        full_name=payload.full_name,
        country=payload.country,
        employment_type=emp_type,
        gross_salary=payload.gross_salary,
        currency=payload.currency,
        bank_account_number=payload.bank_account_number,
        bank_code=payload.bank_code,
        bank_name=payload.bank_name,
        mobile_wallet=payload.mobile_wallet,
        tax_id=payload.tax_id,
        pension_id=payload.pension_id,
    )
    db.add(employee)
    await db.flush()
    return employee


@router.get("/", response_model=EmployeeListResponse)
async def list_employees(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List all employees in the employer's company."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    # Count
    count_result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.company_id == company.id
        )
    )
    total = count_result.scalar() or 0

    # Fetch
    result = await db.execute(
        select(Employee)
        .where(Employee.company_id == company.id)
        .offset(skip)
        .limit(limit)
        .order_by(Employee.full_name)
    )
    employees = result.scalars().all()

    return EmployeeListResponse(employees=employees, total=total)


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific employee's details."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    employee = await db.get(Employee, employee_id)
    if not employee or employee.company_id != company.id:
        raise HTTPException(status_code=404, detail="Employee not found")

    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: UUID,
    payload: EmployeeUpdate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Update an employee's details."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    employee = await db.get(Employee, employee_id)
    if not employee or employee.company_id != company.id:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Handle employment_type enum conversion
    if "employment_type" in update_data:
        val = update_data.pop("employment_type")
        employee.employment_type = (
            EmploymentType.contractor if val == "contractor"
            else EmploymentType.full_time
        )

    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.flush()
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_employee(
    employee_id: UUID,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db),
):
    """Offboard an employee (soft-delete their user account)."""
    company = current_user.company
    if not company:
        raise HTTPException(status_code=404, detail="No company found")

    employee = await db.get(Employee, employee_id)
    if not employee or employee.company_id != company.id:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Soft delete: deactivate user account
    user = await db.get(User, employee.user_id)
    if user:
        user.is_active = False

    await db.flush()


# ── Employee Self-Serve Endpoints ──

@router.get("/me/profile", response_model=EmployeeResponse)
async def get_my_profile(
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db),
):
    """Employee views their own profile."""
    if not current_user.employee_profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return current_user.employee_profile


@router.get("/me/payslips", response_model=list[PayrollEntryResponse])
async def get_my_payslips(
    current_user: User = Depends(require_employee),
    db: AsyncSession = Depends(get_db),
):
    """Employee views their own payslip history."""
    if not current_user.employee_profile:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    result = await db.execute(
        select(PayrollEntry)
        .where(PayrollEntry.employee_id == current_user.employee_profile.id)
        .order_by(PayrollEntry.payroll_run_id.desc())
    )
    entries = result.scalars().all()

    return [
        PayrollEntryResponse(
            id=e.id,
            employee_id=e.employee_id,
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
