"""
Auth schemas — registration, login, and token payloads.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re

# ── Registration ──

class EmployerRegister(BaseModel):
    """Register a new employer + company in a single call."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)
    country_of_incorporation: str = Field(
        min_length=2, max_length=3,
        description="ISO 3166-1 alpha-2 code"
    )
    industry: str | None = None
    currency: str = Field(default="USD", max_length=3)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[0-9]", v) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one number and one special character")
        return v


class EmployeeRegister(BaseModel):
    """Register a new employee (called by employer or self-registration)."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    company_id: UUID
    country: str = Field(min_length=2, max_length=3)
    employment_type: str = Field(default="full_time")
    gross_salary: float = Field(gt=0)
    currency: str = Field(max_length=3)
    bank_account_number: str | None = None
    bank_code: str | None = None
    bank_name: str | None = None
    mobile_wallet: str | None = None
    tax_id: str | None = None
    pension_id: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[0-9]", v) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one number and one special character")
        return v


# ── Login ──

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User Response ──

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
