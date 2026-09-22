from decimal import Decimal
from typing import List
from pydantic import BaseModel, ConfigDict, Field, field_validator


class AmortizationScheduleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month_number: int = Field(..., description="Installment month number (1-indexed)")
    opening_balance: Decimal = Field(..., description="Outstanding principal at the start of this month")
    emi: Decimal = Field(..., description="Equated Monthly Installment paid this month")
    interest_component: Decimal = Field(..., description="Interest portion of this month's EMI")
    principal_component: Decimal = Field(..., description="Principal portion of this month's EMI")
    closing_balance: Decimal = Field(..., description="Outstanding principal at the end of this month")


class AmortizationScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    principal_amount: Decimal = Field(..., description="Original loan principal amount")
    annual_interest_rate: Decimal = Field(..., description="Annual interest rate percentage")
    tenure_months: int = Field(..., description="Total loan duration in months")
    monthly_emi: Decimal = Field(..., description="Equated Monthly Installment")
    total_payment: Decimal = Field(..., description="Total payment across entire tenure")
    total_interest: Decimal = Field(..., description="Total interest paid across entire tenure")
    schedule: List[AmortizationScheduleItem] = Field(..., description="Month-by-month amortization schedule")


class AmortizationRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    principal_amount: Decimal = Field(..., gt=0, description="Loan principal amount (must be > 0)")
    annual_interest_rate: Decimal = Field(..., ge=0, description="Annual interest rate percentage (must be >= 0)")
    tenure_months: int = Field(..., gt=0, description="Tenure in months (must be > 0)")

    @field_validator("principal_amount")
    @classmethod
    def validate_principal(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0.00"):
            raise ValueError("principal_amount must be greater than 0.")
        return v

    @field_validator("annual_interest_rate")
    @classmethod
    def validate_interest_rate(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.00"):
            raise ValueError("annual_interest_rate cannot be negative.")
        return v

    @field_validator("tenure_months")
    @classmethod
    def validate_tenure(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("tenure_months must be greater than 0.")
        return v
