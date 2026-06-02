"""
Company schemas — CRUD and dashboard summary.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CompanyUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    currency: str | None = None
    kora_wallet_id: str | None = None


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    country_of_incorporation: str
    industry: str | None
    currency: str
    kora_wallet_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    """Quick-glance stats for the employer dashboard."""
    total_employees: int
    total_payroll_runs: int
    total_disbursed: float
    total_tax_remitted: float
    pending_advances: int
    countries_covered: list[str]
    recent_payroll_status: str | None = None
