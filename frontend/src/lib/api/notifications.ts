import { apiClient } from './client';
import {
  NotificationGenerateResponse,
  NotificationItem,
  NotificationListResponse,
} from '@/types/notification';
import { MessageResponse } from '@/types/auth';

/**
 * Notifications API Service
 * Interacts directly with FastAPI backend:
 * - GET    /api/v1/notifications
 * - POST   /api/v1/notifications/{id}/read
 * - POST   /api/v1/notifications/mark-all-read
 * - POST   /api/v1/notifications/generate-alerts
 * - DELETE /api/v1/notifications/{id}
 */
export const notificationsApi = {
  /**
   * List notifications for authenticated user
   */
  async list(params?: {
    is_read?: boolean;
    limit?: number;
    auto_generate?: boolean;
  }): Promise<NotificationListResponse> {
    const response = await apiClient.get<NotificationListResponse>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Mark a single notification as read
   */
  async markRead(id: string): Promise<NotificationItem> {
    const response = await apiClient.post<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all or batch notifications as read
   */
  async markAllRead(notificationIds?: string[]): Promise<{ message: string; count: number }> {
    const response = await apiClient.post<{ message: string; count: number }>(
      '/notifications/mark-all-read',
      notificationIds ? { notification_ids: notificationIds } : {}
    );
    return response.data;
  },

  /**
   * Scan and trigger generation of due bill notifications
   */
  async generateAlerts(): Promise<NotificationGenerateResponse> {
    const response = await apiClient.post<NotificationGenerateResponse>(
      '/notifications/generate-alerts'
    );
    return response.data;
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/notifications/${id}`);
    return response.data;
  },
};
