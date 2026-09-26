import { apiClient } from './client';
import {
  ApiBudget,
  BudgetCreate,
  BudgetFilterParams,
  BudgetSpendingSummary,
  BudgetUpdate,
} from '@/types/budget';
import { MessageResponse } from '@/types/auth';

/**
 * Budgets API Service
 * Interacts directly with FastAPI backend:
 * - POST   /api/v1/budgets
 * - GET    /api/v1/budgets
 * - GET    /api/v1/budgets/{id}
 * - PATCH  /api/v1/budgets/{id}
 * - DELETE /api/v1/budgets/{id}
 * - GET    /api/v1/budgets/{id}/spending
 */
export const budgetsApi = {
  /**
   * Create a new category budget
   */
  async create(payload: BudgetCreate): Promise<ApiBudget> {
    const response = await apiClient.post<ApiBudget>('/budgets', payload);
    return response.data;
  },

  /**
   * List all budgets for the authenticated user
   */
  async list(params?: BudgetFilterParams): Promise<ApiBudget[]> {
    const response = await apiClient.get<ApiBudget[]>('/budgets', { params });
    return response.data;
  },

  /**
   * Get budget details by ID with spending summary
   */
  async get(id: string): Promise<ApiBudget> {
    const response = await apiClient.get<ApiBudget>(`/budgets/${id}`);
    return response.data;
  },

  /**
   * Update an existing budget
   */
  async update(id: string, payload: BudgetUpdate): Promise<ApiBudget> {
    const response = await apiClient.patch<ApiBudget>(`/budgets/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a budget by ID
   */
  async delete(id: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/budgets/${id}`);
    return response.data;
  },

  /**
   * Get deterministic spending summary for a budget
   */
  async getSpending(id: string): Promise<BudgetSpendingSummary> {
    const response = await apiClient.get<BudgetSpendingSummary>(`/budgets/${id}/spending`);
    return response.data;
  },
};
