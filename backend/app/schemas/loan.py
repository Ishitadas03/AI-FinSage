from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Self
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class LoanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Loan name or identifier")
    principal_amount: Decimal = Field(..., gt=0, description="Total borrowed principal amount")
    outstanding_principal: Decimal = Field(..., ge=0, description="Remaining principal amount")
    interest_rate: Decimal = Field(..., ge=0, description="Annual interest rate percentage (e.g. 8.5000 for 8.5%)")
    tenure_months: int = Field(..., gt=0, description="Total tenure duration in months")
    monthly_emi: Decimal = Field(..., gt=0, description="Monthly Equated Monthly Installment amount")
    start_date: date = Field(..., description="Loan disbursement start date")
    end_date: Optional[date] = Field(None, description="Projected loan maturity/end date")

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Loan name cannot be empty or only whitespace.")
        return cleaned

    @model_validator(mode="after")
    def validate_outstanding_and_dates(self) -> Self:
        if self.outstanding_principal > self.principal_amount:
            raise ValueError("outstanding_principal cannot exceed principal_amount.")
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date.")
        return self


class LoanCreate(LoanBase):
    pass


class LoanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    principal_amount: Optional[Decimal] = Field(None, gt=0)
    outstanding_principal: Optional[Decimal] = Field(None, ge=0)
    interest_rate: Optional[Decimal] = Field(None, ge=0)
    tenure_months: Optional[int] = Field(None, gt=0)
    monthly_emi: Optional[Decimal] = Field(None, gt=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Loan name cannot be empty or only whitespace.")
            return cleaned
        return v

    @model_validator(mode="after")
    def validate_update_rules(self) -> Self:
        if self.principal_amount is not None and self.outstanding_principal is not None:
            if self.outstanding_principal > self.principal_amount:
                raise ValueError("outstanding_principal cannot exceed principal_amount.")
        if self.start_date is not None and self.end_date is not None:
            if self.end_date < self.start_date:
                raise ValueError("end_date cannot be before start_date.")
        return self


class LoanRead(LoanBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
