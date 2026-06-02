"""
Company model — represents the employer organization.

Each company belongs to exactly one User with role=employer.
Companies hold the Kora wallet reference used as the funding source
for all payroll disbursements and advance credit payouts.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_of_incorporation: Mapped[str] = mapped_column(
        String(3), nullable=False, doc="ISO 3166-1 alpha-2 code"
    )
    industry: Mapped[str] = mapped_column(String(100), nullable=True)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="USD",
        doc="Base operating currency (ISO 4217)"
    )
    kora_wallet_id: Mapped[str] = mapped_column(
        String(100), nullable=True,
        doc="Kora funding wallet identifier"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="company")
    employees: Mapped[list["Employee"]] = relationship(
        "Employee", back_populates="company", cascade="all, delete-orphan"
    )
    payroll_runs: Mapped[list["PayrollRun"]] = relationship(
        "PayrollRun", back_populates="company", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Company {self.name}>"
