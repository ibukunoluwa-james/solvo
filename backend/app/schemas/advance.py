"""
Advance schemas — request, approve, reject, disburse.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AdvanceRequestCreate(BaseModel):
    """Employee requests a salary advance."""
    amount: float = Field(gt=0)
    currency: str = Field(max_length=3)
    reason: str = Field(
        max_length=50,
        description="Category: medical, equipment, emergency, rent, other"
    )
    description: str | None = None


class AdvanceApproval(BaseModel):
    """Employer approves (optionally partial amount)."""
    approved_amount: float | None = Field(
        default=None, gt=0,
        description="If None, approves full requested amount"
    )
    employer_note: str | None = None


class AdvanceRejection(BaseModel):
    """Employer rejects with a reason."""
    employer_note: str = Field(min_length=1)


class AdvanceResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employee_name: str | None = None
    amount: float
    currency: str
    reason: str
    description: str | None
    status: str
    employer_note: str | None
    approved_amount: float | None
    fee_percentage: float
    fee_amount: float
    kora_transfer_id: str | None
    requested_at: datetime
    resolved_at: datetime | None
    disbursed_at: datetime | None

    model_config = {"from_attributes": True}


class AdvanceListResponse(BaseModel):
    advances: list[AdvanceResponse]
    total: int
