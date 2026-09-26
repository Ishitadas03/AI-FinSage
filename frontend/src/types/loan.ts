export interface ApiLoan {
  id: string;
  user_id: string;
  name: string;
  principal_amount: number;
  outstanding_principal: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanCreate {
  name: string;
  principal_amount: number;
  outstanding_principal: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  start_date: string;
  end_date?: string | null;
}

export interface LoanUpdate {
  name?: string;
  principal_amount?: number;
  outstanding_principal?: number;
  interest_rate?: number;
  tenure_months?: number;
  monthly_emi?: number;
  start_date?: string;
  end_date?: string | null;
}

export interface EmiCalculationRequest {
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
}

export interface EmiCalculationResponse {
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
}

export interface AmortizationRequest {
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
}

export interface AmortizationScheduleEntry {
  month: number;
  payment: number;
  principal_paid: number;
  interest_paid: number;
  remaining_balance: number;
}

export interface AmortizationScheduleResponse {
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
  schedule: AmortizationScheduleEntry[];
}

export interface DebtStressAnalysisResponse {
  overall_stress_score: number;
  stress_level: string;
  total_outstanding_debt: number;
  total_monthly_emi: number;
  dti_ratio: number;
  monthly_income: number;
  debt_breakdown: Array<{
    loan_id: string;
    name: string;
    outstanding_balance: number;
    monthly_emi: number;
    interest_rate: number;
    share_of_total_debt: number;
  }>;
  stress_factors: string[];
  recommendations: string[];
}
