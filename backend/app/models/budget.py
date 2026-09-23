"""
Financial Budget SQLAlchemy Model (Phase 4B Part 1).

Represents a user-defined category budget over a specific time window (monthly or weekly).
Enforces strict user ownership, positive amount constraints, and start/end date validation.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import String, Date, DateTime, Numeric, ForeignKey, CheckConstraint, func, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


VALID_BUDGET_PERIODS = {"monthly", "weekly"}

VALID_BUDGET_CATEGORIES = {
    "salary",
    "food",
    "shopping",
    "transport",
    "bills",
    "rent",
    "entertainment",
    "healthcare",
    "education",
    "investment",
    "emi",
    "insurance",
    "cash",
    "other",
}


class Budget(Base):
    __tablename__ = "financial_budgets"

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
    category: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    period: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="monthly",
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )
    end_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
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
    user = relationship("User", backref="budgets")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_financial_budgets_amount_positive"),
        CheckConstraint("end_date >= start_date", name="ck_financial_budgets_date_range"),
        CheckConstraint("period IN ('monthly', 'weekly')", name="ck_financial_budgets_period"),
        CheckConstraint(
            "category IN ('salary', 'food', 'shopping', 'transport', 'bills', 'rent', 'entertainment', 'healthcare', 'education', 'investment', 'emi', 'insurance', 'cash', 'other')",
            name="ck_financial_budgets_category",
        ),
        Index("ix_financial_budgets_user_cat_start", "user_id", "category", "start_date"),
    )

    @validates("name")
    def validate_name(self, key, value):
        if value is None or not str(value).strip():
            raise ValueError("Budget name cannot be empty or whitespace.")
        return str(value).strip()

    @validates("amount")
    def validate_amount(self, key, value):
        if value is not None and Decimal(str(value)) <= Decimal("0.00"):
            raise ValueError("Budget amount must be greater than 0")
        return value

    @validates("category")
    def validate_category(self, key, value):
        cleaned = str(value).strip().lower() if value is not None else ""
        if cleaned not in VALID_BUDGET_CATEGORIES:
            raise ValueError(f"Invalid budget category '{value}'. Must be one of: {sorted(VALID_BUDGET_CATEGORIES)}")
        return cleaned

    @validates("period")
    def validate_period(self, key, value):
        cleaned = str(value).strip().lower() if value is not None else ""
        if cleaned not in VALID_BUDGET_PERIODS:
            raise ValueError(f"Invalid budget period '{value}'. Must be one of: {sorted(VALID_BUDGET_PERIODS)}")
        return cleaned

    def __repr__(self) -> str:
        return f"<Budget id={self.id} user_id={self.user_id} name='{self.name}' category='{self.category}' amount={self.amount} period='{self.period}'>"
