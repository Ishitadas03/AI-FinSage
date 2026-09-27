import { apiClient } from './client';
import { FinancialHealthOverviewResponse, FinancialHealthQueryParams } from '@/types/financialHealth';

/**
 * Financial Health API Service
 * Interacts directly with FastAPI backend:
 * - GET /api/v1/financial-health/overview
 */
export const financialHealthApi = {
  /**
   * Get deterministic financial health overview
   */
  async getOverview(params?: FinancialHealthQueryParams): Promise<FinancialHealthOverviewResponse> {
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.account_id) query.set('account_id', params.account_id);

    const queryString = query.toString();
    const endpoint = `/financial-health/overview${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<FinancialHealthOverviewResponse>(endpoint);
    return response.data;
  },
};
