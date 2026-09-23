"""
Pydantic schemas for the Deterministic Debt Stress Analyzer (Phase 3D-5 Part 1).

All financial values use Decimal for deterministic precision.
Statuses: 'healthy', 'elevated', 'critical', 'insufficient_data'.
These thresholds are FinSage product reference benchmarks, not universal financial truth.
"""
from datetime import date
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# A. Debt Summary
# ---------------------------------------------------------------------------
class DebtSummary(BaseModel):
    """Aggregate debt position across loans and credit cards."""
    model_config = ConfigDict(from_attributes=True)

    total_outstanding_loan_principal: Decimal = Field(
        default=Decimal("0.00"),
        description="Sum of outstanding_principal across all user loans",
    )
    total_monthly_emi: Decimal = Field(
        default=Decimal("0.00"),
        description="Sum of monthly_emi across all user loans",
    )
    active_loan_count: int = Field(
        default=0,
        description="Number of active loans",
    )
    total_credit_card_debt: Decimal = Field(
        default=Decimal("0.00"),
        description="Sum of positive credit-card outstanding balances (ledger-computed)",
    )
    total_credit_limit: Decimal = Field(
        default=Decimal("0.00"),
        description="Sum of credit_limit across all credit-card accounts with valid limits",
    )
    aggregate_credit_utilization: Optional[Decimal] = Field(
        default=None,
        description="(total_credit_card_debt / total_credit_limit) * 100, or None if no valid limits",
    )


# ---------------------------------------------------------------------------
# B. Cash-Flow Pressure
# ---------------------------------------------------------------------------
class CashFlowPressure(BaseModel):
    """Monthly cash-flow position including EMI obligations."""
    model_config = ConfigDict(from_attributes=True)

    monthly_income: Decimal = Field(
        default=Decimal("0.00"),
        description="Total non-transfer income in the analysis period",
    )
    monthly_expenses: Decimal = Field(
        default=Decimal("0.00"),
        description="Total non-transfer expenses in the analysis period",
    )
    monthly_net_cash_flow: Decimal = Field(
        default=Decimal("0.00"),
        description="monthly_income - monthly_expenses",
    )
    monthly_emi: Decimal = Field(
        default=Decimal("0.00"),
        description="Total monthly EMI from active loans",
    )
    cash_flow_after_emi: Decimal = Field(
        default=Decimal("0.00"),
        description="monthly_income - monthly_expenses - monthly_emi",
    )


# ---------------------------------------------------------------------------
# C. Debt Burden Metrics
# ---------------------------------------------------------------------------
class DebtBurdenMetric(BaseModel):
    """A single debt-burden metric with explicit calculability status."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Metric identifier")
    value: Optional[Decimal] = Field(
        None, description="Calculated value, None when insufficient_data"
    )
    unit: str = Field(..., description="Unit of measurement (%, INR, ratio, etc.)")
    status: str = Field(
        ..., description="'calculated' or 'insufficient_data'"
    )
    reason: Optional[str] = Field(
        None,
        description="Explanation when status is insufficient_data",
    )


class DebtBurdenMetrics(BaseModel):
    """Collection of debt burden metrics."""
    model_config = ConfigDict(from_attributes=True)

    emi_to_income_ratio: DebtBurdenMetric = Field(
        ..., description="(monthly_emi / monthly_income) * 100"
    )
    post_emi_cash_flow: DebtBurdenMetric = Field(
        ..., description="monthly_income - monthly_expenses - monthly_emi"
    )
    debt_service_pressure: DebtBurdenMetric = Field(
        ..., description="Ratio of recurring debt payments (EMI) to net cash flow"
    )


# ---------------------------------------------------------------------------
# D. Stress Indicators
# ---------------------------------------------------------------------------
class StressIndicator(BaseModel):
    """
    Individual stress indicator with metric value, status, and benchmark.

    Status thresholds are FinSage product reference benchmarks.
    """
    model_config = ConfigDict(from_attributes=True)

    metric: str = Field(..., description="Indicator identifier")
    value: Optional[Decimal] = Field(
        None, description="Metric value, None if insufficient_data"
    )
    unit: str = Field(..., description="Unit of measurement")
    status: str = Field(
        ..., description="'healthy', 'elevated', 'critical', or 'insufficient_data'"
    )
    explanation: str = Field(
        ..., description="Human-readable explanation of the indicator status"
    )
    benchmark: Optional[str] = Field(
        None,
        description="FinSage reference benchmark for this indicator (not universal financial truth)",
    )


# ---------------------------------------------------------------------------
# E. Data Completeness
# ---------------------------------------------------------------------------
class DataCompletenessItem(BaseModel):
    """A single missing-data note."""
    model_config = ConfigDict(from_attributes=True)

    field: str = Field(..., description="The data element that is missing/incomplete")
    reason: str = Field(..., description="Why this data gap impacts analysis")


# ---------------------------------------------------------------------------
# Top-Level Response
# ---------------------------------------------------------------------------
class DebtStressAnalysisResponse(BaseModel):
    """
    Deterministic Debt Stress Analysis response.

    Same database state and inputs always produce the same result.
    """
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    analysis_date: date = Field(..., description="Date the analysis was computed")
    start_date: date = Field(..., description="Start of analysis period (inclusive)")
    end_date: date = Field(..., description="End of analysis period (inclusive)")
    days_in_period: int = Field(..., description="Number of days in the analysis window")

    debt_summary: DebtSummary
    cash_flow_pressure: CashFlowPressure
    debt_burden_metrics: DebtBurdenMetrics
    stress_indicators: List[StressIndicator]
    data_completeness: List[DataCompletenessItem]
