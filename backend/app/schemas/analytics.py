from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class AnalyticsPeriod(BaseModel):
    start_date: datetime = Field(..., description="Start of the analyzed time window (inclusive)")
    end_date: datetime = Field(..., description="End of the analyzed time window (inclusive)")


class AnalyticsSummary(BaseModel):
    total_income: Decimal = Field(default=Decimal("0.00"), description="Sum of all non-transfer income")
    total_expenses: Decimal = Field(default=Decimal("0.00"), description="Sum of all non-transfer expenses")
    net_cash_flow: Decimal = Field(default=Decimal("0.00"), description="total_income minus total_expenses")
    savings_rate: Decimal = Field(
        default=Decimal("0.00"),
        description="Percentage of income saved: (net_cash_flow / total_income) * 100",
    )


class CategoryBreakdownItem(BaseModel):
    category: str = Field(..., description="Category name")
    amount: Decimal = Field(..., description="Total monetary amount in this category")
    percentage: Decimal = Field(..., description="Share percentage of total expenses or income")


class AccountBreakdownItem(BaseModel):
    account_id: uuid.UUID = Field(..., description="Account identifier")
    account_name: str = Field(..., description="Account display name")
    account_type: str = Field(..., description="Account category/type")
    income: Decimal = Field(default=Decimal("0.00"), description="Income received in this account")
    expenses: Decimal = Field(default=Decimal("0.00"), description="Expenses paid from this account")
    net_cash_flow: Decimal = Field(default=Decimal("0.00"), description="income minus expenses for this account")


class TrendItem(BaseModel):
    period: str = Field(..., description="Time period label (YYYY-MM-DD for daily, YYYY-MM for monthly)")
    income: Decimal = Field(default=Decimal("0.00"), description="Income in this period")
    expenses: Decimal = Field(default=Decimal("0.00"), description="Expenses in this period")
    net_cash_flow: Decimal = Field(default=Decimal("0.00"), description="Net cash flow in this period")


class TopExpenseItem(BaseModel):
    id: uuid.UUID = Field(..., description="Transaction identifier")
    amount: Decimal = Field(..., description="Expense amount")
    category: str = Field(..., description="Expense category")
    merchant: Optional[str] = Field(None, description="Merchant or payee name")
    description: Optional[str] = Field(None, description="Transaction notes/description")
    transaction_date: datetime = Field(..., description="When the expense occurred")
    account_id: uuid.UUID = Field(..., description="Account used for this expense")
    account_name: str = Field(..., description="Name of the account")


class AnalyticsOverviewResponse(BaseModel):
    period: AnalyticsPeriod
    summary: AnalyticsSummary
    spending_by_category: List[CategoryBreakdownItem]
    income_by_category: List[CategoryBreakdownItem]
    account_breakdown: List[AccountBreakdownItem]
    trend: List[TrendItem]
    top_expenses: List[TopExpenseItem]
