export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
}

export interface AnalyticsSummary {
  total_income: number | string;
  total_expenses: number | string;
  net_cash_flow: number | string;
  savings_rate: number | string;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number | string;
  percentage: number | string;
}

export interface AccountBreakdownItem {
  account_id: string;
  account_name: string;
  account_type: string;
  income: number | string;
  expenses: number | string;
  net_cash_flow: number | string;
}

export interface TrendItem {
  period: string;
  income: number | string;
  expenses: number | string;
  net_cash_flow: number | string;
}

export interface TopExpenseItem {
  id: string;
  amount: number | string;
  category: string;
  merchant?: string | null;
  description?: string | null;
  transaction_date: string;
  account_id: string;
  account_name: string;
}

export interface AnalyticsOverviewResponse {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary;
  spending_by_category: CategoryBreakdownItem[];
  income_by_category: CategoryBreakdownItem[];
  account_breakdown: AccountBreakdownItem[];
  trend: TrendItem[];
  top_expenses: TopExpenseItem[];
}

export interface AnalyticsQueryParams {
  start_date?: string;
  end_date?: string;
  account_id?: string;
}
