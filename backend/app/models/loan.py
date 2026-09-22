from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import String, Date, DateTime, Numeric, Integer, ForeignKey, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    principal_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    outstanding_principal: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    interest_rate: Mapped[Decimal] = mapped_column(
        Numeric(8, 4),
        nullable=False,
    )
    tenure_months: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    monthly_emi: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="loans")

    __table_args__ = (
        CheckConstraint("principal_amount > 0", name="ck_loans_principal_amount_positive"),
        CheckConstraint("outstanding_principal >= 0", name="ck_loans_outstanding_principal_non_negative"),
        CheckConstraint("outstanding_principal <= principal_amount", name="ck_loans_outstanding_lte_principal"),
        CheckConstraint("interest_rate >= 0", name="ck_loans_interest_rate_non_negative"),
        CheckConstraint("tenure_months > 0", name="ck_loans_tenure_months_positive"),
        CheckConstraint("monthly_emi > 0", name="ck_loans_monthly_emi_positive"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="ck_loans_end_date_gte_start_date"),
    )

    @validates("principal_amount")
    def validate_principal_amount(self, key, value):
        if value is not None and Decimal(str(value)) <= Decimal("0.00"):
            raise ValueError("principal_amount must be greater than 0")
        return value

    @validates("outstanding_principal")
    def validate_outstanding_principal(self, key, value):
        if value is not None and Decimal(str(value)) < Decimal("0.00"):
            raise ValueError("outstanding_principal must be greater than or equal to 0")
        return value

    @validates("interest_rate")
    def validate_interest_rate(self, key, value):
        if value is not None and Decimal(str(value)) < Decimal("0.00"):
            raise ValueError("interest_rate must be greater than or equal to 0")
        return value

    @validates("tenure_months")
    def validate_tenure_months(self, key, value):
        if value is not None and int(value) <= 0:
            raise ValueError("tenure_months must be greater than 0")
        return value

    @validates("monthly_emi")
    def validate_monthly_emi(self, key, value):
        if value is not None and Decimal(str(value)) <= Decimal("0.00"):
            raise ValueError("monthly_emi must be greater than 0")
        return value

    def __repr__(self) -> str:
        return f"<Loan id={self.id} user_id={self.user_id} name={self.name} principal={self.principal_amount} outstanding={self.outstanding_principal}>"
