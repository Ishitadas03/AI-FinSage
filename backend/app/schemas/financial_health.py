from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.credit_utilization import CardUtilizationItem
from app.schemas.debt_stress import DebtStressAnalysisResponse


class HealthMetricItem(BaseModel):
    """
    Standard representation for an individual deterministic financial health metric.
    Includes numerical value, status evaluation, benchmark explanation, and precision.
    """
    model_config = ConfigDict(from_attributes=True)

    value: Optional[Decimal] = Field(None, description="Calculated metric value, or None if insufficient data")
    unit: str = Field(..., description="Unit of measurement, e.g., '%', 'months', 'ratio'")
    status: str = Field(..., description="Deterministic status: 'healthy', 'moderate', 'critical', 'insufficient_data'")
    benchmark: Optional[str] = Field(None, description="Standard financial planning reference benchmark")
    explanation: str = Field(..., description="Deterministic explanation based on values and boundaries")


class FinancialHealthOverviewResponse(BaseModel):
    """
    Deterministic Financial Health Overview response.
    Provides calculated foundation metrics from verified ledger balances, loans, and transactions without arbitrary scoring or ML.
    """
    model_config = ConfigDict(from_attributes=True)

    start_date: date
    end_date: date
    days_in_period: int

    # Financial balance baselines (all Decimal)
    liquid_assets: Decimal = Field(..., description="Total liquid balances (Savings + Current + Cash)")
    credit_card_debt: Decimal = Field(..., description="Total credit card liability (sum of positive credit card balances)")
    investment_assets: Decimal = Field(..., description="Total investment account balances")
    total_assets: Decimal = Field(..., description="Sum of positive non-liability account balances")

    # Period Cashflow totals
    total_income: Decimal = Field(..., description="Total non-transfer income in period")
    total_expenses: Decimal = Field(..., description="Total non-transfer expenses in period")
    net_cashflow: Decimal = Field(..., description="total_income - total_expenses")

    # Loan / Debt Summary baselines
    total_outstanding_loan_principal: Decimal = Field(
        default=Decimal("0.00"),
        description="Total outstanding principal balance across all user loans",
    )
    total_monthly_emi: Decimal = Field(
        default=Decimal("0.00"),
        description="Total scheduled monthly EMI across all user loans",
    )
    active_loan_count: int = Field(
        default=0,
        description="Total number of active loan accounts",
    )

    # Calculable Deterministic Metrics
    savings_rate: HealthMetricItem = Field(..., description="Percentage of income retained: (Income - Expenses) / Income * 100")
    expense_ratio: HealthMetricItem = Field(..., description="Percentage of income spent: Expenses / Income * 100")
    emergency_fund_coverage_months: HealthMetricItem = Field(..., description="Months of expenses covered by liquid assets")
    debt_to_liquid_ratio: HealthMetricItem = Field(..., description="Credit card debt relative to liquid assets: CC Debt / Liquid Assets * 100")
    investment_allocation_ratio: HealthMetricItem = Field(..., description="Investment assets relative to total assets: Investments / Total Assets * 100")

    # Integrated Debt & Credit Health Metrics
    credit_card_utilization: HealthMetricItem = Field(
        ...,
        description="Aggregate credit card utilization: Total CC Debt / Total Credit Limits * 100",
    )
    debt_to_income_ratio: HealthMetricItem = Field(
        ...,
        description="Debt-to-Income (DTI) ratio based on reliable gross income",
    )

    # Detailed Credit Utilization breakdown
    credit_card_details: Optional[List[CardUtilizationItem]] = Field(
        default_factory=list,
        description="Per-card credit utilization diagnostics",
    )

    # Diagnostic metadata regarding remaining requirements
    data_completeness_notes: List[str] = Field(
        default_factory=list,
        description="Explicit notes on required data for remaining metrics",
    )

    # Integrated Debt Stress Analysis (Phase 3D-5 Part 3)
    debt_stress: Optional[DebtStressAnalysisResponse] = Field(
        default=None,
        description="Deterministic debt stress analysis including debt summary, cash flow pressure, burden metrics, and indicators",
    )
