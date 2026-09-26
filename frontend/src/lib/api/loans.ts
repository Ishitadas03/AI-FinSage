import { apiClient } from './client';

import {
  ApiLoan,
  LoanCreate,
  LoanUpdate,
  EmiCalculationRequest,
  EmiCalculationResponse,
  AmortizationRequest,
  AmortizationScheduleResponse,
  DebtStressAnalysisResponse,
} from '@/types/loan';

export const loansApi = {
  /**
   * List all active loan records for the authenticated user.
   */
  async list(): Promise<ApiLoan[]> {
    const response = await apiClient.get<ApiLoan[]>('/loans');
    return response.data;
  },

  /**
   * Get details of a single loan by ID.
   */
  async get(id: string): Promise<ApiLoan> {
    const response = await apiClient.get<ApiLoan>(`/loans/${id}`);
    return response.data;
  },

  /**
   * Create a new loan for the authenticated user.
   */
  async create(payload: LoanCreate): Promise<ApiLoan> {
    const response = await apiClient.post<ApiLoan>('/loans', payload);
    return response.data;
  },

  /**
   * Update an existing loan.
   */
  async update(id: string, payload: LoanUpdate): Promise<ApiLoan> {
    const response = await apiClient.patch<ApiLoan>(`/loans/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a loan record.
   */
  async delete(id: string): Promise<boolean> {
    await apiClient.delete(`/loans/${id}`);
    return true;
  },

  /**
   * Calculate EMI for given parameters via backend EMI calculator endpoint.
   */
  async calculateEmi(payload: EmiCalculationRequest): Promise<EmiCalculationResponse> {
    const response = await apiClient.post<EmiCalculationResponse>('/emi/calculate', payload);
    return response.data;
  },

  /**
   * Generate complete amortization schedule via backend API.
   */
  async getAmortization(payload: AmortizationRequest): Promise<AmortizationScheduleResponse> {
    const response = await apiClient.post<AmortizationScheduleResponse>('/emi/amortization', payload);
    return response.data;
  },

  /**
   * Get deterministic debt stress analysis overview for authenticated user.
   */
  async getDebtStress(params?: { start_date?: string; end_date?: string }): Promise<DebtStressAnalysisResponse> {
    const response = await apiClient.get<DebtStressAnalysisResponse>('/debt-stress/overview', {
      params,
    });
    return response.data;
  },
};
