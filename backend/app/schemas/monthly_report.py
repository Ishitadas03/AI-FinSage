"""
Pydantic Schemas for Dynamic Monthly Financial Reports (Phase 4).
"""
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ReportPeriod(BaseModel):
    start_date: str
    end_date: str
    month_label: str
    days_in_period: int
    is_complete: bool


class ReportFinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float
    daily_burn_rate: float


class ReportPeriodComparison(BaseModel):
    has_previous_period: bool
    previous_income: float
    previous_expenses: float
    previous_net_savings: float
    income_change_pct: Optional[float] = None
    expense_change_pct: Optional[float] = None
    net_savings_change: Optional[float] = None
    note: Optional[str] = None


class ReportCategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    transaction_count: int


class ReportTopExpense(BaseModel):
    id: str
    date: str
    merchant: str
    category: str
    amount: float


class ReportBudgetAuditItem(BaseModel):
    category: str
    allocated: float
    spent: float
    remaining: float
    utilization_pct: float
    is_overrun: bool


class ReportUpcomingObligation(BaseModel):
    name: str
    due_date: str
    amount: float
    obligation_type: str  # 'recurring_bill' | 'loan_emi'
    status: str


class ReportFinancialHealth(BaseModel):
    overall_score: int
    grade: str
    status: str
    dti_ratio: float
    savings_rate_score: float
    debt_score: float


class ReportActionChecklistItem(BaseModel):
    id: str
    title: str
    description: str
    impact: str
    category: str
    done: bool = False


class MonthlyFinancialReportResponse(BaseModel):
    period: ReportPeriod
    summary: ReportFinancialSummary
    comparison: ReportPeriodComparison
    categories: List[ReportCategoryBreakdown]
    top_expenses: List[ReportTopExpense]
    budget_audit: List[ReportBudgetAuditItem]
    upcoming_obligations: List[ReportUpcomingObligation]
    financial_health: ReportFinancialHealth
    executive_summary: str
    action_checklist: List[ReportActionChecklistItem]
    missing_data_notes: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
