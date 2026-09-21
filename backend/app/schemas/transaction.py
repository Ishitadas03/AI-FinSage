from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class TransactionCategory(str, Enum):
    SALARY = "salary"
    FOOD = "food"
    SHOPPING = "shopping"
    TRANSPORT = "transport"
    BILLS = "bills"
    RENT = "rent"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    INVESTMENT = "investment"
    EMI = "emi"
    INSURANCE = "insurance"
    CASH = "cash"
    OTHER = "other"


class TransactionBase(BaseModel):
    account_id: uuid.UUID = Field(..., description="ID of the source financial account")
    destination_account_id: Optional[uuid.UUID] = Field(
        None,
        description="ID of destination financial account (required for transfers, null otherwise)",
    )
    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        decimal_places=2,
        description="Transaction amount in precise Decimal format (strictly greater than zero)",
    )
    transaction_type: TransactionType = Field(..., description="Transaction type (income, expense, transfer)")
    category: TransactionCategory = Field(..., description="Controlled transaction category")
    merchant: Optional[str] = Field(None, max_length=255, description="Merchant or payee name")
    description: Optional[str] = Field(None, max_length=500, description="Optional notes or description")
    transaction_date: datetime = Field(..., description="Timestamp when the transaction occurred")

    @field_validator("merchant")
    @classmethod
    def sanitize_merchant(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v


class TransactionCreate(TransactionBase):
    @model_validator(mode="after")
    def validate_transfer_destination(self) -> "TransactionCreate":
        if self.transaction_type == TransactionType.TRANSFER:
            if not self.destination_account_id:
                raise ValueError("destination_account_id is required when transaction_type is 'transfer'.")
            if self.destination_account_id == self.account_id:
                raise ValueError("Source account and destination account cannot be the same.")
        else:
            if self.destination_account_id is not None:
                raise ValueError("destination_account_id must be null for non-transfer transactions.")
        return self


class TransactionUpdate(BaseModel):
    account_id: Optional[uuid.UUID] = Field(None, description="Updated source financial account ID")
    destination_account_id: Optional[uuid.UUID] = Field(
        None,
        description="Updated destination financial account ID",
    )
    amount: Optional[Decimal] = Field(
        None,
        gt=Decimal("0.00"),
        decimal_places=2,
        description="Updated monetary amount (must be > 0.00)",
    )
    transaction_type: Optional[TransactionType] = Field(None, description="Updated transaction type")
    category: Optional[TransactionCategory] = Field(None, description="Updated category")
    merchant: Optional[str] = Field(None, max_length=255, description="Updated merchant name")
    description: Optional[str] = Field(None, max_length=500, description="Updated description")
    transaction_date: Optional[datetime] = Field(None, description="Updated transaction date")

    @field_validator("merchant")
    @classmethod
    def sanitize_merchant(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v

    @model_validator(mode="after")
    def validate_transfer_update(self) -> "TransactionUpdate":
        if self.account_id is not None and self.destination_account_id is not None:
            if self.account_id == self.destination_account_id:
                raise ValueError("Source account and destination account cannot be the same.")
        if (
            self.transaction_type in (TransactionType.INCOME, TransactionType.EXPENSE)
            and self.destination_account_id is not None
        ):
            raise ValueError("destination_account_id must be null for non-transfer transactions.")
        return self


class TransactionRead(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TransactionPaginatedResponse(BaseModel):
    items: List[TransactionRead]
    total: int
    page: int
    page_size: int
    total_pages: int
