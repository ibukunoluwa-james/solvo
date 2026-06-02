"""
Employee schemas — add, update, and list.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class EmployeeCreate(BaseModel):
    """Add an employee to the company (employer action)."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
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


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    country: str | None = None
    employment_type: str | None = None
    gross_salary: float | None = None
    currency: str | None = None
    bank_account_number: str | None = None
    bank_code: str | None = None
    bank_name: str | None = None
    mobile_wallet: str | None = None
    tax_id: str | None = None
    pension_id: str | None = None


class EmployeeResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID
    full_name: str
    country: str
    employment_type: str
    gross_salary: float
    currency: str
    bank_account_number: str | None
    bank_code: str | None
    bank_name: str | None
    mobile_wallet: str | None
    tax_id: str | None
    pension_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeResponse]
    total: int
