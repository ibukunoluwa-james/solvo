"""
Payroll schemas — run creation, preview, execution, and entry details.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


# ── Run Management ──

class PayrollRunCreate(BaseModel):
    """Create a new payroll run for a given month/year."""
    period_month: int = Field(ge=1, le=12)
    period_year: int = Field(ge=2020, le=2030)
    notes: str | None = None


class PayrollRunResponse(BaseModel):
    id: UUID
    company_id: UUID
    period_month: int
    period_year: int
    status: str
    total_gross: float
    total_net: float
    total_tax: float
    total_pension: float
    employee_count: int
    kora_batch_id: str | None
    notes: str | None
    initiated_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class PayrollRunListResponse(BaseModel):
    runs: list[PayrollRunResponse]
    total: int


# ── Entry / Payslip ──

class PayrollEntryResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employee_name: str | None = None
    employee_country: str | None = None
    gross_salary: float
    paye_tax: float
    pension_employee: float
    pension_employer: float
    nhf: float
    other_deductions: float
    net_salary: float
    currency: str
    kora_transfer_id: str | None
    status: str

    model_config = {"from_attributes": True}


class PayrollPreviewResponse(BaseModel):
    """Preview result before executing — shows what each employee will receive."""
    run_id: UUID
    period: str
    total_gross: float
    total_net: float
    total_tax: float
    total_pension: float
    employee_count: int
    entries: list[PayrollEntryResponse]
    tax_summary: list["TaxSummaryItem"]


class TaxSummaryItem(BaseModel):
    country: str
    authority: str
    tax_type: str
    total_amount: float
    currency: str
