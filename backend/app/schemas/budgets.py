"""
Pydantic schemas for Financial Budgets (Phase 4B Part 1).

Provides validation, serialization, and spending summaries for user category budgets.
Strictly excludes client-controlled user_id from create and update payloads.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Self
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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

VALID_BUDGET_STATUSES = {"healthy", "warning", "over_budget"}


class BudgetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Budget name or label")
    category: str = Field(..., description="Target spending category")
    amount: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2, description="Allocated budget limit in INR")
    period: str = Field(default="monthly", description="Budget period: monthly or weekly")
    start_date: date = Field(..., description="Start date of budget tracking window")
    end_date: date = Field(..., description="End date of budget tracking window")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Budget name cannot be empty or only whitespace.")
        return cleaned

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_BUDGET_CATEGORIES:
            raise ValueError(f"Invalid budget category '{v}'. Must be one of: {sorted(VALID_BUDGET_CATEGORIES)}")
        return cleaned

    @field_validator("period")
    @classmethod
    def validate_period(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_BUDGET_PERIODS:
            raise ValueError(f"Invalid budget period '{v}'. Must be one of: {sorted(VALID_BUDGET_PERIODS)}")
        return cleaned

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date.")
        return self


class BudgetCreate(BudgetBase):
    """Payload for creating a new budget. user_id is NOT client-controlled."""
    pass


class BudgetUpdate(BaseModel):
    """Payload for updating an existing budget. Partial updates supported. user_id is NOT client-controlled."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"), decimal_places=2)
    period: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Budget name cannot be empty or only whitespace.")
            return cleaned
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().lower()
            if cleaned not in VALID_BUDGET_CATEGORIES:
                raise ValueError(f"Invalid budget category '{v}'. Must be one of: {sorted(VALID_BUDGET_CATEGORIES)}")
            return cleaned
        return v

    @field_validator("period")
    @classmethod
    def validate_period(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().lower()
            if cleaned not in VALID_BUDGET_PERIODS:
                raise ValueError(f"Invalid budget period '{v}'. Must be one of: {sorted(VALID_BUDGET_PERIODS)}")
            return cleaned
        return v

    @model_validator(mode="after")
    def validate_update_date_range(self) -> Self:
        if self.start_date is not None and self.end_date is not None:
            if self.end_date < self.start_date:
                raise ValueError("end_date cannot be before start_date.")
        return self


class BudgetRead(BudgetBase):
    """Public read model for financial budgets."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BudgetSpendingSummary(BaseModel):
    """Calculated spending metrics for a category budget."""
    model_config = ConfigDict(from_attributes=True)

    budget_id: Optional[uuid.UUID] = Field(None, description="ID of associated budget if applicable")
    budget_name: Optional[str] = Field(None, description="Name of associated budget if applicable")
    category: str = Field(..., description="Tracked category")
    start_date: date = Field(..., description="Start date of spending evaluation window")
    end_date: date = Field(..., description="End date of spending evaluation window")
    budget_amount: Decimal = Field(..., description="Allocated budget amount")
    actual_spending: Decimal = Field(..., description="Total expenses recorded in category during period")
    remaining_amount: Decimal = Field(..., description="Remaining unspent budget (min 0.00)")
    over_budget_amount: Decimal = Field(..., description="Amount spent in excess of budget (min 0.00)")
    spending_percentage: Decimal = Field(..., description="Percentage of budget consumed: (actual / budget) * 100")
    status: str = Field(..., description="Budget status: healthy (<=80%), warning (>80% and <=100%), over_budget (>100%)")


class BudgetWithSpending(BudgetRead):
    """Budget read model enriched with its real-time spending metrics."""
    spending: BudgetSpendingSummary
