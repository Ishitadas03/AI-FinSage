/**
 * Financial Data Management & Lifecycle API Client (Phase 5).
 */
import { apiClient } from './client';
import {
  UserDataExportResponse,
  AuditLogListResponse,
  UserDeleteRequest,
  AccountDeletionResponse,
} from '../../types';

export const dataManagementApi = {
  /**
   * Export user financial data in structured JSON format.
   */
  async exportDataJson(): Promise<UserDataExportResponse> {
    const res = await apiClient.get<UserDataExportResponse>('/data-management/export?format=json');
    return res.data;
  },

  /**
   * Export user financial data in multi-CSV ZIP format as a downloadable Blob.
   */
  async exportDataCsvZip(): Promise<Blob> {
    const res = await apiClient.get('/data-management/export?format=csv', {
      responseType: 'blob',
    });
    return res.data;
  },

  /**
   * Fetch authenticated user's isolated audit logs.
   */
  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogListResponse> {
    const res = await apiClient.get<AuditLogListResponse>('/data-management/audit-logs', {
      params: { limit, offset },
    });
    return res.data;
  },

  /**
   * Submit permanent account deletion request.
   */
  async deleteAccount(payload: UserDeleteRequest): Promise<AccountDeletionResponse> {
    const res = await apiClient.post<AccountDeletionResponse>(
      '/data-management/delete-account',
      payload
    );
    return res.data;
  },
};
