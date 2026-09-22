from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class CardUtilizationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account_id: uuid.UUID
    account_name: str
    credit_limit: Optional[Decimal] = None
    outstanding_balance: Decimal
    utilization_percentage: Optional[Decimal] = None
    status: str = Field(
        ...,
        description="Health status: 'healthy', 'moderate', 'critical', 'insufficient_data'",
    )
    explanation: str


class AggregateUtilization(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_outstanding: Decimal
    total_credit_limit: Decimal
    utilization_percentage: Optional[Decimal] = None
    status: str = Field(
        ...,
        description="Aggregate health status: 'healthy', 'moderate', 'critical', 'insufficient_data'",
    )
    explanation: str


class CreditUtilizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    cards: List[CardUtilizationItem]
    aggregate: AggregateUtilization
