from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import String, Date, DateTime, Numeric, Text, ForeignKey, CheckConstraint, func, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


VALID_GOAL_TYPES = {
    "emergency_fund",
    "education",
    "travel",
    "vehicle",
    "home",
    "retirement",
    "investment",
    "purchase",
    "other",
}

VALID_PRIORITIES = {"low", "medium", "high"}
VALID_STATUSES = {"active", "completed", "paused", "cancelled"}


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

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
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    goal_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    target_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    current_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
    )
    target_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False,
        default="active",
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
    user = relationship("User", backref="financial_goals")

    __table_args__ = (
        CheckConstraint("target_amount > 0", name="ck_financial_goals_target_amount_positive"),
        CheckConstraint("current_amount >= 0", name="ck_financial_goals_current_amount_non_negative"),
        CheckConstraint("current_amount <= target_amount", name="ck_financial_goals_current_lte_target"),
        CheckConstraint("priority IN ('low', 'medium', 'high')", name="ck_financial_goals_priority"),
        CheckConstraint("status IN ('active', 'completed', 'paused', 'cancelled')", name="ck_financial_goals_status"),
        CheckConstraint(
            "goal_type IN ('emergency_fund', 'education', 'travel', 'vehicle', 'home', 'retirement', 'investment', 'purchase', 'other')",
            name="ck_financial_goals_goal_type",
        ),
        Index("ix_financial_goals_user_id_status", "user_id", "status"),
    )

    @validates("name")
    def validate_name(self, key, value):
        if value is None or not str(value).strip():
            raise ValueError("Goal name cannot be empty or only whitespace.")
        return str(value).strip()

    @validates("target_amount")
    def validate_target_amount(self, key, value):
        if value is not None and Decimal(str(value)) <= Decimal("0.00"):
            raise ValueError("target_amount must be greater than 0")
        return value

    @validates("current_amount")
    def validate_current_amount(self, key, value):
        if value is not None and Decimal(str(value)) < Decimal("0.00"):
            raise ValueError("current_amount must be greater than or equal to 0")
        return value

    @validates("goal_type")
    def validate_goal_type(self, key, value):
        if value not in VALID_GOAL_TYPES:
            raise ValueError(f"Invalid goal_type '{value}'. Must be one of {sorted(VALID_GOAL_TYPES)}")
        return value

    @validates("priority")
    def validate_priority(self, key, value):
        if value not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority '{value}'. Must be one of {sorted(VALID_PRIORITIES)}")
        return value

    @validates("status")
    def validate_status(self, key, value):
        if value not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{value}'. Must be one of {sorted(VALID_STATUSES)}")
        return value

    def __repr__(self) -> str:
        return f"<FinancialGoal id={self.id} user_id={self.user_id} name='{self.name}' target={self.target_amount} current={self.current_amount} status='{self.status}'>"
