export interface AmortizationScheduleItem {
  month_number: number;
  opening_balance: number | string;
  emi: number | string;
  interest_component: number | string;
  principal_component: number | string;
  closing_balance: number | string;
}

export interface AmortizationScheduleResponse {
  principal_amount: number | string;
  annual_interest_rate: number | string;
  tenure_months: number;
  monthly_emi: number | string;
  total_payment: number | string;
  total_interest: number | string;
  schedule: AmortizationScheduleItem[];
}

export interface AmortizationRequest {
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
}
