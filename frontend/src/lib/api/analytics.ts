import { apiClient } from './client';
import { AnalyticsOverviewResponse, AnalyticsQueryParams } from '@/types/analytics';

/**
 * Analytics API Service
 * Interacts directly with FastAPI backend:
 * - GET /api/v1/analytics/overview
 */
export const analyticsApi = {
  /**
   * Get analytics overview for date range and optional account
   */
  async getOverview(params?: AnalyticsQueryParams): Promise<AnalyticsOverviewResponse> {
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.account_id) query.set('account_id', params.account_id);

    const queryString = query.toString();
    const endpoint = `/analytics/overview${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<AnalyticsOverviewResponse>(endpoint);
    return response.data;
  },
};
