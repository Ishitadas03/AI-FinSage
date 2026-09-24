from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.transaction import TransactionType


class StatementFormat(str, Enum):
    DEBIT_CREDIT = "debit_credit"
    SIGNED_AMOUNT = "signed_amount"


class RowValidationError(BaseModel):
    row_number: int = Field(..., description="1-indexed row number in the CSV data")
    field: Optional[str] = Field(None, description="Field or column causing the validation failure")
    error_message: str = Field(..., description="Descriptive error explanation")
    raw_value: Optional[str] = Field(None, description="Original raw value that failed validation")


class NormalizedTransactionRow(BaseModel):
    transaction_date: datetime = Field(..., description="Normalized transaction date")
    description: Optional[str] = Field(None, max_length=500, description="Normalized transaction description")
    merchant: Optional[str] = Field(None, max_length=255, description="Extracted merchant or payee name")
    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        decimal_places=2,
        description="Positive transaction amount in Decimal format",
    )
    type: TransactionType = Field(..., description="Transaction type (income, expense, transfer)")
    category: Optional[str] = Field(None, description="Category placeholder, set to null at import stage")
    reference: Optional[str] = Field(None, max_length=255, description="Reference number, transaction ID, or UTR")
    raw_row: Dict[str, Any] = Field(default_factory=dict, description="Raw CSV row key-value metadata for preview/debugging")


class BankStatementParseResult(BaseModel):
    total_rows: int = Field(..., ge=0, description="Total data rows processed")
    valid_rows: int = Field(..., ge=0, description="Number of valid rows successfully normalized")
    invalid_rows: int = Field(..., ge=0, description="Number of invalid rows with validation errors")
    normalized_rows: List[NormalizedTransactionRow] = Field(default_factory=list, description="List of normalized transaction rows")
    validation_errors: List[RowValidationError] = Field(default_factory=list, description="List of structured row-level validation errors")
    format_detected: Optional[StatementFormat] = Field(None, description="Detected statement structure format")
    detected_columns: Optional[Dict[str, str]] = Field(None, description="Mapping of normalized canonical fields to original CSV headers")
