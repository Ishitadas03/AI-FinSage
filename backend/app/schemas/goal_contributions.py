"""
Pydantic schemas for Financial Goal Contributions (Phase 4A Part 3).

Provides validation and serialization for goal contribution ledger entries.
Strictly excludes client-controlled user_id and goal_id from payload schemas.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


class GoalContributionBase(BaseModel):
    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        decimal_places=2,
        description="Monetary contribution amount (must be strictly greater than 0)",
    )
    contribution_date: date = Field(
        ...,
        description="Date of the contribution",
    )
    note: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional memo or description for the contribution",
    )

    @field_validator("note")
    @classmethod
    def sanitize_note(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v


class GoalContributionCreate(GoalContributionBase):
    """Payload for recording a new goal contribution. user_id and goal_id are NOT client-controlled."""
    pass


class GoalContributionRead(GoalContributionBase):
    """Public read model for goal contribution ledger records."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    goal_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class GoalContributionSummary(BaseModel):
    """Summary of recorded contributions for a financial goal."""
    model_config = ConfigDict(from_attributes=True)

    total_contributions: Decimal = Field(..., description="Sum of all recorded contributions")
    contribution_count: int = Field(..., description="Total count of contribution records")
    latest_contribution_date: Optional[date] = Field(None, description="Date of most recent contribution")
