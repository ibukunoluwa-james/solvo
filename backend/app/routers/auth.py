"""
Auth Router — Registration, login, token refresh.

Endpoints:
    POST /register/employer  — Create employer user + company
    POST /register/employee  — Create employee user + profile
    POST /login              — JWT login (returns access + refresh)
    POST /refresh            — Refresh access token
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.rate_limit import limiter
from app.dependencies import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)
from app.models.user import User, UserRole, TokenBlocklist
from app.models.company import Company
from app.models.employee import Employee, EmploymentType
from app.schemas.auth import (
    EmployerRegister,
    EmployeeRegister,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)
from app.config import settings
from jose import JWTError, jwt

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/register/employer",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_employer(
    payload: EmployerRegister,
    db: AsyncSession = Depends(get_db),
):
    """Register a new employer and their company."""
    # Check for duplicate email
    existing = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.employer,
    )
    db.add(user)
    await db.flush()

    # Create company
    company = Company(
        user_id=user.id,
        name=payload.company_name,
        country_of_incorporation=payload.country_of_incorporation,
        industry=payload.industry,
        currency=payload.currency,
    )
    db.add(company)
    await db.flush()

    return user


@router.post(
    "/register/employee",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_employee(
    payload: EmployeeRegister,
    db: AsyncSession = Depends(get_db),
):
    """Register a new employee (can be called by employer or self-registration)."""
    # Check duplicate email
    existing = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Verify company exists
    company = await db.get(Company, payload.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Create user
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.employee,
    )
    db.add(user)
    await db.flush()

    # Create employee profile
    emp_type = (
        EmploymentType.contractor
        if payload.employment_type == "contractor"
        else EmploymentType.full_time
    )
    employee = Employee(
        user_id=user.id,
        company_id=payload.company_id,
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

    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return JWT tokens."""
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role.value,
        user_id=str(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh an expired access token using a valid refresh token."""
    try:
        # Check if the token is blacklisted
        is_blacklisted = await db.execute(
            select(TokenBlocklist).where(TokenBlocklist.token == payload.refresh_token)
        )
        if is_blacklisted.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )

        data = jwt.decode(
            payload.refresh_token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        if data.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = data.get("sub")
        role = data.get("role")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    token_data = {"sub": user_id, "role": role}
    access_token = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        role=role,
        user_id=user_id,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout by blacklisting the refresh token."""
    # We could also validate the JWT signature, but if it's invalid it won't be usable anyway.
    blocklisted_token = TokenBlocklist(token=payload.refresh_token)
    db.add(blocklisted_token)
    await db.commit()
    return None

