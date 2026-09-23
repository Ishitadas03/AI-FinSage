"""
Pydantic schemas for Financial Goals (Phase 4A Part 1).

Deterministic validation and serialization for user financial goals.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Self
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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


class FinancialGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Goal name or title")
    description: Optional[str] = Field(None, max_length=1000, description="Optional goal description")
    goal_type: str = Field(..., description="Goal category/type")
    target_amount: Decimal = Field(..., gt=0, description="Target financial goal amount")
    current_amount: Decimal = Field(default=Decimal("0.00"), ge=0, description="Current accumulated amount")
    target_date: date = Field(..., description="Target completion date")
    priority: str = Field(default="medium", description="Goal priority: low, medium, high")
    status: str = Field(default="active", description="Goal status: active, completed, paused, cancelled")

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Goal name cannot be empty or only whitespace.")
        return cleaned

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_GOAL_TYPES:
            raise ValueError(f"Invalid goal_type '{v}'. Must be one of: {sorted(VALID_GOAL_TYPES)}")
        return cleaned

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority '{v}'. Must be one of: {sorted(VALID_PRIORITIES)}")
        return cleaned

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Must be one of: {sorted(VALID_STATUSES)}")
        return cleaned

    @model_validator(mode="after")
    def validate_current_lte_target(self) -> Self:
        if self.current_amount > self.target_amount:
            raise ValueError("current_amount cannot exceed target_amount.")
        return self


class FinancialGoalCreate(FinancialGoalBase):
    """Payload for creating a new financial goal. user_id is NOT client-controlled."""
    pass


class FinancialGoalUpdate(BaseModel):
    """Payload for updating an existing financial goal. Partial updates supported. user_id is NOT client-controlled."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    goal_type: Optional[str] = None
    target_amount: Optional[Decimal] = Field(None, gt=0)
    current_amount: Optional[Decimal] = Field(None, ge=0)
    target_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Goal name cannot be empty or only whitespace.")
            return cleaned
        return v

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().lower()
            if cleaned not in VALID_GOAL_TYPES:
                raise ValueError(f"Invalid goal_type '{v}'. Must be one of: {sorted(VALID_GOAL_TYPES)}")
            return cleaned
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().lower()
            if cleaned not in VALID_PRIORITIES:
                raise ValueError(f"Invalid priority '{v}'. Must be one of: {sorted(VALID_PRIORITIES)}")
            return cleaned
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().lower()
            if cleaned not in VALID_STATUSES:
                raise ValueError(f"Invalid status '{v}'. Must be one of: {sorted(VALID_STATUSES)}")
            return cleaned
        return v

    @model_validator(mode="after")
    def validate_update_current_lte_target(self) -> Self:
        if self.target_amount is not None and self.current_amount is not None:
            if self.current_amount > self.target_amount:
                raise ValueError("current_amount cannot exceed target_amount.")
        return self


class FinancialGoalRead(FinancialGoalBase):
    """Public read model for financial goals."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class GoalDerivedState(BaseModel):
    """Calculated derived states for a financial goal (kept separate from persisted status)."""
    model_config = ConfigDict(from_attributes=True)

    progress_percentage: Decimal = Field(..., description="Progress percentage: (current_amount / target_amount) * 100")
    remaining_amount: Decimal = Field(..., description="Remaining amount needed: target_amount - current_amount")
    remaining_months: int = Field(..., description="Calendar months remaining until target_date")
    required_monthly_contribution: Optional[Decimal] = Field(
        None,
        description="Required monthly savings to meet target. None if overdue and remaining > 0, 0.00 if completed.",
    )
    is_overdue: bool = Field(..., description="True if target_date has passed and remaining_amount > 0")
    is_on_track: bool = Field(..., description="Deterministic indicator if goal is currently on track")
    contribution_total: Optional[Decimal] = Field(
        None,
        description="Total sum of recorded contribution ledger entries if calculated",
    )
    has_contribution_history: bool = Field(
        default=False,
        description="True if goal has recorded contribution ledger entries",
    )



class FinancialGoalWithDerivedState(FinancialGoalRead):
    """Financial goal response enriched with deterministic calculation derived states."""
    derived_state: GoalDerivedState
