from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Self
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class AccountType(str, Enum):
    SAVINGS = "savings"
    CURRENT = "current"
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    OTHER = "other"


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Account display name")
    account_type: AccountType = Field(..., description="Financial account category")
    balance: Decimal = Field(default=Decimal("0.00"), description="Monetary balance (precise Decimal representation)")
    credit_limit: Optional[Decimal] = Field(
        default=None,
        description="Credit limit (only allowed for credit_card accounts, Numeric 18,2)",
    )
    currency: str = Field(default="INR", min_length=3, max_length=3, description="3-letter ISO currency code")

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Account name cannot be empty or only whitespace.")
        return cleaned

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("credit_limit")
    @classmethod
    def validate_credit_limit_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < Decimal("0.00"):
            raise ValueError("Credit limit cannot be negative.")
        return v

    @model_validator(mode="after")
    def validate_credit_limit_only_for_credit_card(self) -> Self:
        if self.credit_limit is not None and self.account_type != AccountType.CREDIT_CARD:
            raise ValueError("Credit limit is only allowed for credit_card accounts.")
        return self


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Updated account name")
    account_type: Optional[AccountType] = Field(None, description="Updated account category")
    balance: Optional[Decimal] = Field(None, description="Updated monetary balance")
    credit_limit: Optional[Decimal] = Field(None, description="Updated credit limit (only applicable for credit_card)")
    currency: Optional[str] = Field(None, min_length=3, max_length=3, description="Updated currency code")

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Account name cannot be empty or only whitespace.")
            return cleaned
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().upper()
        return v

    @field_validator("credit_limit")
    @classmethod
    def validate_credit_limit_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < Decimal("0.00"):
            raise ValueError("Credit limit cannot be negative.")
        return v

    @model_validator(mode="after")
    def validate_credit_limit_with_account_type(self) -> Self:
        if self.credit_limit is not None and self.account_type is not None and self.account_type != AccountType.CREDIT_CARD:
            raise ValueError("Credit limit is only allowed for credit_card accounts.")
        return self


class AccountRead(AccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    current_balance: Decimal = Field(
        default=Decimal("0.00"),
        description="Dynamically calculated current balance based on opening balance and all ledger transactions",
    )
    created_at: datetime
    updated_at: datetime
