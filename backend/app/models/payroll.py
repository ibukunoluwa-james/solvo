"""
Payroll models — PayrollRun and PayrollEntry.

A PayrollRun is one execution of payroll for a company in a given month/year.
It flows through: draft → processing → completed | failed

Each PayrollEntry is one employee's payslip within that run, holding the
gross → deductions → net breakdown and the Kora transfer reference.

Design decision: We store both the run-level totals AND per-entry breakdowns.
The run totals are denormalized for dashboard performance — the source of truth
is always the sum of entries, but we avoid N+1 aggregation queries on every
dashboard load.
"""

import uuid
import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    ForeignKey,
    Numeric,
    Enum as SAEnum,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PayrollRunStatus(str, enum.Enum):
    draft = "draft"
    previewed = "previewed"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PayrollEntryStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    settled = "settled"
    failed = "failed"


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Period ──
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)

    # ── Status ──
    status: Mapped[PayrollRunStatus] = mapped_column(
        SAEnum(PayrollRunStatus, name="payroll_run_status", create_constraint=True),
        default=PayrollRunStatus.draft,
    )

    # ── Denormalized Totals (for fast dashboard reads) ──
    total_gross: Mapped[Decimal] = mapped_column(
        Numeric(16, 2), default=Decimal("0.00")
    )
    total_net: Mapped[Decimal] = mapped_column(
        Numeric(16, 2), default=Decimal("0.00")
    )
    total_tax: Mapped[Decimal] = mapped_column(
        Numeric(16, 2), default=Decimal("0.00")
    )
    total_pension: Mapped[Decimal] = mapped_column(
        Numeric(16, 2), default=Decimal("0.00")
    )
    employee_count: Mapped[int] = mapped_column(Integer, default=0)

    # ── Kora Batch ──
    kora_batch_id: Mapped[str] = mapped_column(
        String(100), nullable=True,
        doc="Kora bulk payout batch reference"
    )

    # ── Notes ──
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    # ── Timestamps ──
    initiated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──
    company: Mapped["Company"] = relationship("Company", back_populates="payroll_runs")
    entries: Mapped[list["PayrollEntry"]] = relationship(
        "PayrollEntry", back_populates="payroll_run", cascade="all, delete-orphan"
    )
    tax_remittances: Mapped[list["TaxRemittance"]] = relationship(
        "TaxRemittance", back_populates="payroll_run", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PayrollRun {self.period_year}-{self.period_month:02d} ({self.status.value})>"


class PayrollEntry(Base):
    __tablename__ = "payroll_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payroll_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Salary Breakdown ──
    gross_salary: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    paye_tax: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00")
    )
    pension_employee: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"),
        doc="Employee's pension contribution"
    )
    pension_employer: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"),
        doc="Employer's pension contribution (not deducted from gross)"
    )
    nhf: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"),
        doc="National Housing Fund or equivalent"
    )
    other_deductions: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00")
    )
    net_salary: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # ── Kora Transfer ──
    kora_transfer_id: Mapped[str] = mapped_column(
        String(100), nullable=True,
        doc="Individual transfer reference from Kora"
    )
    status: Mapped[PayrollEntryStatus] = mapped_column(
        SAEnum(PayrollEntryStatus, name="payroll_entry_status", create_constraint=True),
        default=PayrollEntryStatus.pending,
    )

    # ── Relationships ──
    payroll_run: Mapped["PayrollRun"] = relationship(
        "PayrollRun", back_populates="entries"
    )
    employee: Mapped["Employee"] = relationship(
        "Employee", back_populates="payroll_entries"
    )

    def __repr__(self) -> str:
        return f"<PayrollEntry {self.employee_id} net={self.net_salary}>"
