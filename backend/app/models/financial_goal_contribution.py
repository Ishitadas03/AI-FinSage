"""
Financial Goal Contribution Model (Phase 4A Part 3).

Stores immutable, auditable contribution ledger records towards a user's financial goal.
Enforces strict user ownership, positive amount constraints, and cascade delete behavior.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid
from sqlalchemy import Date, DateTime, Numeric, Text, ForeignKey, CheckConstraint, func, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.models.base import Base


class FinancialGoalContribution(Base):
    __tablename__ = "financial_goal_contributions"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    goal_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("financial_goals.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    contribution_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )
    note: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    goal = relationship("FinancialGoal", backref="contributions")
    user = relationship("User", backref="financial_goal_contributions")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_goal_contributions_amount_positive"),
        Index("ix_goal_contributions_goal_date", "goal_id", "contribution_date"),
    )

    @validates("amount")
    def validate_amount(self, key, value):
        if value is not None and Decimal(str(value)) <= Decimal("0.00"):
            raise ValueError("Contribution amount must be greater than 0")
        return value

    def __repr__(self) -> str:
        return f"<FinancialGoalContribution id={self.id} goal_id={self.goal_id} user_id={self.user_id} amount={self.amount} date={self.contribution_date}>"
