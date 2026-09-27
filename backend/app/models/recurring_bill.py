"""
Recurring Bill & Subscription SQLAlchemy Model (Phase 3).

Represents a recurring financial commitment/bill (e.g., rent, utilities, subscriptions, insurance).
Includes frequency rules, deterministic next due date tracking, linked payment accounts,
and explicit posting idempotency safeguards.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import (
    String,
    Date,
    DateTime,
    Numeric,
    Boolean,
    Integer,
    ForeignKey,
    CheckConstraint,
    func,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


VALID_BILL_FREQUENCIES = {
    "daily",
    "weekly",
    "biweekly",
    "monthly",
    "quarterly",
    "semi_annual",
    "annual",
}

VALID_BILL_STATUSES = {
    "active",
    "paused",
    "cancelled",
}


class RecurringBill(Base):
    __tablename__ = "recurring_bills"

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
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    merchant: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    category: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
        default="bills",
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    frequency: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="monthly",
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    next_due_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
        index=True,
    )
    auto_post: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    last_posted_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    reminder_days_before: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
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
    user = relationship("User", backref="recurring_bills")
    account = relationship("Account", backref="recurring_bills")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_recurring_bills_amount_positive"),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_recurring_bills_date_range",
        ),
        CheckConstraint(
            "frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annual', 'annual')",
            name="ck_recurring_bills_frequency",
        ),
        CheckConstraint(
            "status IN ('active', 'paused', 'cancelled')",
            name="ck_recurring_bills_status",
        ),
        Index("ix_recurring_bills_user_status_due", "user_id", "status", "next_due_date"),
    )

    @validates("name")
    def validate_name(self, key, value):
        if value is None or not str(value).strip():
            raise ValueError("Recurring bill name cannot be empty or whitespace.")
        return str(value).strip()

    @validates("amount")
    def validate_amount(self, key, value):
        if value is not None and Decimal(str(value)) <= Decimal("0.00"):
            raise ValueError("Recurring bill amount must be greater than 0.")
        return value

    @validates("frequency")
    def validate_frequency(self, key, value):
        cleaned = str(value).strip().lower() if value is not None else ""
        if cleaned not in VALID_BILL_FREQUENCIES:
            raise ValueError(f"Invalid bill frequency '{value}'. Must be one of: {sorted(VALID_BILL_FREQUENCIES)}")
        return cleaned

    @validates("status")
    def validate_status(self, key, value):
        cleaned = str(value).strip().lower() if value is not None else ""
        if cleaned not in VALID_BILL_STATUSES:
            raise ValueError(f"Invalid bill status '{value}'. Must be one of: {sorted(VALID_BILL_STATUSES)}")
        return cleaned

    def __repr__(self) -> str:
        return f"<RecurringBill id={self.id} user_id={self.user_id} name='{self.name}' amount={self.amount} next_due_date={self.next_due_date} status='{self.status}'>"
