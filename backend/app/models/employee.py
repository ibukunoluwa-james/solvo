"""
Employee model — represents a worker on an employer's payroll.

Each employee has a User for login and belongs to a Company.
Stores banking details needed by Kora for disbursement, plus
tax identifiers for compliance engine calculations.

Design note: `gross_salary` is the monthly base — the tax engine
applies jurisdiction-specific deductions against this figure.
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


class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    contractor = "contractor"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Personal ──
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(
        String(3), nullable=False, doc="ISO 3166-1 alpha-2 (NG, KE, GH…)"
    )
    employment_type: Mapped[EmploymentType] = mapped_column(
        SAEnum(EmploymentType, name="employment_type", create_constraint=True),
        default=EmploymentType.full_time,
    )

    # ── Compensation ──
    gross_salary: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False,
        doc="Monthly gross salary in local currency"
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, doc="ISO 4217 local currency code"
    )

    # ── Banking (for Kora disbursement) ──
    bank_account_number: Mapped[str] = mapped_column(
        String(30), nullable=True
    )
    bank_code: Mapped[str] = mapped_column(
        String(20), nullable=True,
        doc="Bank identifier code for Kora routing"
    )
    bank_name: Mapped[str] = mapped_column(String(100), nullable=True)
    mobile_wallet: Mapped[str] = mapped_column(
        String(30), nullable=True, doc="M-Pesa / MTN MoMo number"
    )

    # ── Tax Identifiers ──
    tax_id: Mapped[str] = mapped_column(
        String(30), nullable=True, doc="NIN (NG), KRA PIN (KE), TIN (GH)"
    )
    pension_id: Mapped[str] = mapped_column(
        String(30), nullable=True, doc="PFA PIN / NSSF number"
    )

    # ── Timestamps ──
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ──
    user: Mapped["User"] = relationship("User", back_populates="employee_profile")
    company: Mapped["Company"] = relationship("Company", back_populates="employees")
    payroll_entries: Mapped[list["PayrollEntry"]] = relationship(
        "PayrollEntry", back_populates="employee", cascade="all, delete-orphan"
    )
    advance_requests: Mapped[list["AdvanceRequest"]] = relationship(
        "AdvanceRequest", back_populates="employee", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Employee {self.full_name} ({self.country})>"
