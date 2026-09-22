from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmiCalculationRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    principal_amount: Decimal = Field(..., gt=0, description="Loan principal amount (must be > 0)")
    annual_interest_rate: Decimal = Field(..., ge=0, description="Annual interest rate percentage (e.g., 8.5 for 8.5%, must be >= 0)")
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


class EmiCalculationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    principal_amount: Decimal = Field(..., description="Principal amount borrowed")
    annual_interest_rate: Decimal = Field(..., description="Annual interest rate percentage")
    tenure_months: int = Field(..., description="Total loan duration in months")
    monthly_emi: Decimal = Field(..., description="Equated Monthly Installment")
    total_payment: Decimal = Field(..., description="Total payment across entire tenure (monthly_emi * tenure_months)")
    total_interest: Decimal = Field(..., description="Total interest paid (total_payment - principal_amount)")
