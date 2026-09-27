from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


class RecurringBillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name or description of recurring bill")
    merchant: Optional[str] = Field(None, max_length=255, description="Merchant or vendor name")
    category: str = Field(default="bills", max_length=100, description="Spending category")
    amount: Decimal = Field(..., gt=0, description="Monetary billing amount")
    frequency: str = Field(default="monthly", description="Billing frequency: daily, weekly, biweekly, monthly, quarterly, semi_annual, annual")
    start_date: date = Field(..., description="First effective recurrence date")
    end_date: Optional[date] = Field(None, description="Optional cancellation / termination date")
    account_id: Optional[uuid.UUID] = Field(None, description="Optional linked payment account")
    auto_post: bool = Field(default=False, description="Whether transactions should be automatically posted")
    reminder_days_before: int = Field(default=3, ge=0, le=30, description="Days before due date to alert user")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Recurring bill name cannot be empty or whitespace.")
        return cleaned

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("Recurring bill amount must be greater than 0.")
        return v

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        valid_freqs = {"daily", "weekly", "biweekly", "monthly", "quarterly", "semi_annual", "annual"}
        cleaned = v.strip().lower()
        if cleaned not in valid_freqs:
            raise ValueError(f"Invalid frequency '{v}'. Must be one of: {sorted(valid_freqs)}")
        return cleaned


class RecurringBillCreate(RecurringBillBase):
    pass


class RecurringBillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    merchant: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    amount: Optional[Decimal] = Field(None, gt=0)
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    account_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    auto_post: Optional[bool] = None
    reminder_days_before: Optional[int] = Field(None, ge=0, le=30)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Recurring bill name cannot be empty or whitespace.")
            return cleaned
        return v

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_freqs = {"daily", "weekly", "biweekly", "monthly", "quarterly", "semi_annual", "annual"}
            cleaned = v.strip().lower()
            if cleaned not in valid_freqs:
                raise ValueError(f"Invalid frequency '{v}'. Must be one of: {sorted(valid_freqs)}")
            return cleaned
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = {"active", "paused", "cancelled"}
            cleaned = v.strip().lower()
            if cleaned not in valid_statuses:
                raise ValueError(f"Invalid status '{v}'. Must be one of: {sorted(valid_statuses)}")
            return cleaned
        return v


class RecurringBillPostPaymentRequest(BaseModel):
    account_id: Optional[uuid.UUID] = Field(None, description="Account to debit for this payment (defaults to bill's linked account)")
    payment_date: Optional[date] = Field(None, description="Actual payment date (defaults to today)")
    amount: Optional[Decimal] = Field(None, gt=0, description="Override payment amount (defaults to bill's registered amount)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional transaction notes")


class RecurringBillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    account_id: Optional[uuid.UUID] = None
    account_name: Optional[str] = None
    name: str
    merchant: Optional[str] = None
    category: str
    amount: Decimal
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    next_due_date: date
    status: str
    auto_post: bool
    last_posted_date: Optional[date] = None
    reminder_days_before: int
    is_overdue: bool = False
    days_until_due: int = 0
    created_at: datetime
    updated_at: datetime


class RecurringBillListResponse(BaseModel):
    items: List[RecurringBillResponse]
    total: int
    active_count: int
    monthly_committed_total: Decimal
