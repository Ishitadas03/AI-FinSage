import { apiClient } from './client';
import {
  RecurringBill,
  RecurringBillCreateRequest,
  RecurringBillListResponse,
  RecurringBillPaymentResult,
  RecurringBillPostPaymentRequest,
  RecurringBillUpdateRequest,
} from '@/types/recurringBill';
import { MessageResponse } from '@/types/auth';

/**
 * Recurring Bills API Service
 * Interacts directly with FastAPI backend:
 * - POST   /api/v1/recurring-bills
 * - GET    /api/v1/recurring-bills
 * - GET    /api/v1/recurring-bills/{id}
 * - PUT    /api/v1/recurring-bills/{id}
 * - POST   /api/v1/recurring-bills/{id}/pause
 * - POST   /api/v1/recurring-bills/{id}/resume
 * - POST   /api/v1/recurring-bills/{id}/post-payment
 * - DELETE /api/v1/recurring-bills/{id}
 */
export const recurringBillsApi = {
  /**
   * Create a new recurring bill
   */
  async create(payload: RecurringBillCreateRequest): Promise<RecurringBill> {
    const response = await apiClient.post<RecurringBill>('/recurring-bills', payload);
    return response.data;
  },

  /**
   * List all recurring bills for authenticated user
   */
  async list(status?: string): Promise<RecurringBillListResponse> {
    const response = await apiClient.get<RecurringBillListResponse>('/recurring-bills', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  /**
   * Get single recurring bill by ID
   */
  async get(id: string): Promise<RecurringBill> {
    const response = await apiClient.get<RecurringBill>(`/recurring-bills/${id}`);
    return response.data;
  },

  /**
   * Update an existing recurring bill
   */
  async update(id: string, payload: RecurringBillUpdateRequest): Promise<RecurringBill> {
    const response = await apiClient.put<RecurringBill>(`/recurring-bills/${id}`, payload);
    return response.data;
  },

  /**
   * Pause an active recurring bill
   */
  async pause(id: string): Promise<RecurringBill> {
    const response = await apiClient.post<RecurringBill>(`/recurring-bills/${id}/pause`);
    return response.data;
  },

  /**
   * Resume a paused recurring bill
   */
  async resume(id: string): Promise<RecurringBill> {
    const response = await apiClient.post<RecurringBill>(`/recurring-bills/${id}/resume`);
    return response.data;
  },

  /**
   * Explicitly record a posted payment for this bill cycle
   */
  async postPayment(
    id: string,
    payload?: RecurringBillPostPaymentRequest
  ): Promise<RecurringBillPaymentResult> {
    const response = await apiClient.post<RecurringBillPaymentResult>(
      `/recurring-bills/${id}/post-payment`,
      payload || {}
    );
    return response.data;
  },

  /**
   * Delete a recurring bill
   */
  async delete(id: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/recurring-bills/${id}`);
    return response.data;
  },
};
