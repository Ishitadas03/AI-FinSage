export interface ReportPeriod {
  month_str: string;
  month_label: string;
  start_date: string;
  end_date: string;
  is_current_month: boolean;
  days_in_month: number;
  days_elapsed: number;
}

export interface ReportFinancialSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  burn_rate_daily: number;
  transaction_count: number;
  active_accounts_count: number;
}

export interface ReportPeriodComparison {
  has_previous_period: boolean;
  previous_month_label?: string | null;
  previous_income: number;
  previous_expenses: number;
  previous_net_savings: number;
  previous_savings_rate: number;
  income_change_pct?: number | null;
  expense_change_pct?: number | null;
  savings_change_pct?: number | null;
  is_incomplete_comparison: boolean;
}

export interface ReportCategoryBreakdown {
  category: string;
  amount: number;
  percentage_of_total: number;
  transaction_count: number;
}

export interface ReportTopExpense {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
}

export interface ReportBudgetAuditItem {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilization_pct: number;
  is_overrun: boolean;
  overrun_amount: number;
}

export interface ReportUpcomingObligation {
  type: 'recurring_bill' | 'loan_emi';
  name: string;
  amount: number;
  due_date: string;
  account_name?: string | null;
  frequency: string;
}

export interface ReportFinancialHealth {
  score: number;
  grade: string;
  metrics: Record<string, any>;
}

export interface ReportActionChecklistItem {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MonthlyFinancialReportResponse {
  period: ReportPeriod;
  summary: ReportFinancialSummary;
  comparison: ReportPeriodComparison;
  categories: ReportCategoryBreakdown[];
  top_expenses: ReportTopExpense[];
  budget_audit: ReportBudgetAuditItem[];
  upcoming_obligations: ReportUpcomingObligation[];
  financial_health: ReportFinancialHealth;
  executive_summary: string;
  action_checklist: ReportActionChecklistItem[];
  missing_data_notes: string[];
  generated_at: string;
}
