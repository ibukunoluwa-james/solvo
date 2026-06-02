"""
Auth Dependencies — JWT token validation and role-based guards.

Design:
    - get_current_user: Extracts + validates JWT from Authorization header.
      Returns the User ORM object (with eager-loaded company/employee_profile).
    - require_employer: Guard that ensures the user has role=employer.
    - require_employee: Guard that ensures the user has role=employee.

    These are injected as FastAPI Depends() in route signatures, so every
    protected endpoint gets automatic auth with zero boilerplate.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole

# ── Password Hashing ──
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 Scheme ──
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT and return the authenticated User with relationships loaded."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .options(
            selectinload(User.company),
            selectinload(User.employee_profile),
        )
        .where(User.id == UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


async def require_employer(
    current_user: User = Depends(get_current_user),
) -> User:
    """Guard: only employers can access this endpoint."""
    if current_user.role != UserRole.employer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an employer account",
        )
    return current_user


async def require_employee(
    current_user: User = Depends(get_current_user),
) -> User:
    """Guard: only employees can access this endpoint."""
    if current_user.role != UserRole.employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an employee account",
        )
    return current_user
