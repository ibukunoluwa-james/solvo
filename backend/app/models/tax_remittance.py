"""
TaxRemittance model — records each statutory payment to a revenue authority.

After a payroll run is executed, the tax engine aggregates deductions by
country and tax type, creating TaxRemittance records. These track the
obligation, the amount, and whether it has been remitted to the authority.

This is the compliance audit trail — regulators need to see every remittance
with a reference number and timestamp.
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
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RemittanceStatus(str, enum.Enum):
    pending = "pending"
    remitted = "remitted"
    failed = "failed"


class TaxRemittance(Base):
    __tablename__ = "tax_remittances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payroll_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Jurisdiction ──
    country: Mapped[str] = mapped_column(
        String(3), nullable=False, doc="ISO 3166-1 alpha-2"
    )
    authority: Mapped[str] = mapped_column(
        String(100), nullable=False,
        doc="Revenue authority name (e.g. FIRS, KRA, GRA)"
    )
    tax_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        doc="PAYE, Pension, NHF, NHIF, NSSF, etc."
    )

    # ── Amount ──
    amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # ── Status ──
    status: Mapped[RemittanceStatus] = mapped_column(
        SAEnum(RemittanceStatus, name="remittance_status", create_constraint=True),
        default=RemittanceStatus.pending,
    )
    reference: Mapped[str] = mapped_column(
        String(100), nullable=True,
        doc="Revenue authority payment reference"
    )

    # ── Timestamps ──
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    remitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    # ── Relationships ──
    payroll_run: Mapped["PayrollRun"] = relationship(
        "PayrollRun", back_populates="tax_remittances"
    )

    def __repr__(self) -> str:
        return f"<TaxRemittance {self.country}/{self.tax_type} {self.amount}>"
