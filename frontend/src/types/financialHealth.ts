export interface HealthMetricItem {
  value: number | string | null;
  unit: string;
  status: 'healthy' | 'moderate' | 'critical' | 'insufficient_data';
  benchmark?: string | null;
  explanation: string;
}

export interface CardUtilizationItem {
  account_id: string;
  account_name: string;
  credit_limit: number | string;
  current_balance: number | string;
  utilization_percentage: number | string;
  status: string;
  available_credit: number | string;
}

export interface DebtSummary {
  total_debt: number | string;
  total_credit_card_debt: number | string;
  total_loan_principal: number | string;
  total_monthly_debt_service: number | string;
  active_loan_count: number;
}

export interface CashFlowPressure {
  monthly_income: number | string;
  monthly_expenses: number | string;
  net_cash_flow: number | string;
  debt_service_ratio: number | string;
  debt_service_ratio_status: string;
}

export interface DebtBurdenMetrics {
  debt_to_income_ratio: number | string;
  dti_status: string;
  debt_to_liquid_assets_ratio: number | string;
  dtla_status: string;
  runway_with_debt_months: number | string | null;
  runway_status: string;
}

export interface DebtStressAnalysisResponse {
  debt_summary: DebtSummary;
  cash_flow_pressure: CashFlowPressure;
  debt_burden_metrics: DebtBurdenMetrics;
  overall_stress_level: string;
  stress_score: number;
  key_stress_factors: string[];
}

export interface FinancialHealthOverviewResponse {
  start_date: string;
  end_date: string;
  days_in_period: number;

  liquid_assets: number | string;
  credit_card_debt: number | string;
  investment_assets: number | string;
  total_assets: number | string;

  total_income: number | string;
  total_expenses: number | string;
  net_cashflow: number | string;

  total_outstanding_loan_principal: number | string;
  total_monthly_emi: number | string;
  active_loan_count: number;

  savings_rate: HealthMetricItem;
  expense_ratio: HealthMetricItem;
  emergency_fund_coverage_months: HealthMetricItem;
  debt_to_liquid_ratio: HealthMetricItem;
  investment_allocation_ratio: HealthMetricItem;

  credit_card_utilization: HealthMetricItem;
  debt_to_income_ratio: HealthMetricItem;

  credit_card_details?: CardUtilizationItem[];
  data_completeness_notes?: string[];
  debt_stress?: DebtStressAnalysisResponse | null;
}

export interface FinancialHealthQueryParams {
  start_date?: string;
  end_date?: string;
  account_id?: string;
}
