import { apiClient } from './client';
import { MonthlyFinancialReportResponse } from '@/types/monthlyReport';

/**
 * Financial Reports API Client (Phase 4)
 * - GET /api/v1/reports/monthly
 */
export const reportsApi = {
  /**
   * Get dynamic monthly financial report
   * @param month Optional YYYY-MM formatted string (e.g. '2026-09')
   */
  async getMonthlyReport(month?: string): Promise<MonthlyFinancialReportResponse> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const response = await apiClient.get<MonthlyFinancialReportResponse>(`/reports/monthly${query}`);
    return response.data;
  },
};
