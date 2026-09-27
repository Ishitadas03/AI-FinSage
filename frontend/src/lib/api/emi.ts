import { apiClient } from './client';
import { AmortizationRequest, AmortizationScheduleResponse } from '@/types/amortization';

export interface EmiCalculationRequest {
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
}

export interface EmiCalculationResponse {
  principal_amount: number | string;
  annual_interest_rate: number | string;
  tenure_months: number;
  monthly_emi: number | string;
  total_payment: number | string;
  total_interest: number | string;
}

/**
 * EMI & Amortization API Service
 * Interacts directly with FastAPI backend:
 * - POST /api/v1/emi/calculate
 * - POST /api/v1/emi/amortization (or /api/v1/emi/amortization-schedule)
 */
export const emiApi = {
  /**
   * Calculate EMI deterministic figures
   */
  async calculate(payload: EmiCalculationRequest): Promise<EmiCalculationResponse> {
    const response = await apiClient.post<EmiCalculationResponse>('/emi/calculate', payload);
    return response.data;
  },

  /**
   * Generate full month-by-month amortization schedule
   */
  async getAmortizationSchedule(payload: AmortizationRequest): Promise<AmortizationScheduleResponse> {
    const response = await apiClient.post<AmortizationScheduleResponse>('/emi/amortization-schedule', payload);
    return response.data;
  },
};
