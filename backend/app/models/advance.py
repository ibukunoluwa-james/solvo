"""
AdvanceRequest model — emergency salary advance credit.

Flow: employee requests → employer approves/rejects → on approval,
system disburses via Kora and auto-deducts from next payroll run.

The fee (2-3% flat) is calculated at approval time based on company policy.
Eligibility guard: employees can only request up to 50% of their net salary,
and only if they have no outstanding (undisbursed) advance.
"""

import uuid
import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AdvanceStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    disbursed = "disbursed"
    repaid = "repaid"


class AdvanceRequest(Base):
    __tablename__ = "advance_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Request Details ──
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    reason: Mapped[str] = mapped_column(
        String(50), nullable=False,
        doc="Category: medical, equipment, emergency, rent, other"
    )
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # ── Status ──
    status: Mapped[AdvanceStatus] = mapped_column(
        SAEnum(AdvanceStatus, name="advance_status", create_constraint=True),
        default=AdvanceStatus.pending,
    )

    # ── Employer Response ──
    employer_note: Mapped[str] = mapped_column(Text, nullable=True)
    approved_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=True,
        doc="Employer may approve a partial amount"
    )

    # ── Fees ──
    fee_percentage: Mapped[Decimal] = mapped_column(
        Numeric(4, 2), default=Decimal("2.50"),
        doc="Flat fee percentage applied on disbursement"
    )
    fee_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00")
    )

    # ── Kora Disbursement ──
    kora_transfer_id: Mapped[str] = mapped_column(String(100), nullable=True)

    # ── Timestamps ──
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    resolved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    disbursed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──
    employee: Mapped["Employee"] = relationship(
        "Employee", back_populates="advance_requests"
    )

    def __repr__(self) -> str:
        return f"<AdvanceRequest {self.amount} {self.currency} ({self.status.value})>"
