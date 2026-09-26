import { apiClient } from './client';
import {
  ApiGoal,
  GoalContribution,
  GoalContributionCreate,
  GoalCreate,
  GoalFilterParams,
  GoalUpdate,
} from '@/types/goal';
import { MessageResponse } from '@/types/auth';

/**
 * Goals API Service
 * Interacts directly with FastAPI backend:
 * - POST   /api/v1/goals
 * - GET    /api/v1/goals
 * - GET    /api/v1/goals/{id}
 * - PATCH  /api/v1/goals/{id}
 * - DELETE /api/v1/goals/{id}
 * - POST   /api/v1/goals/{id}/contributions
 * - GET    /api/v1/goals/{id}/contributions
 * - GET    /api/v1/goals/{id}/contributions/{contribution_id}
 * - DELETE /api/v1/goals/{id}/contributions/{contribution_id}
 */
export const goalsApi = {
  /**
   * Create a new financial goal
   */
  async create(payload: GoalCreate): Promise<ApiGoal> {
    const response = await apiClient.post<ApiGoal>('/goals', payload);
    return response.data;
  },

  /**
   * List all goals for the authenticated user
   */
  async list(params?: GoalFilterParams): Promise<ApiGoal[]> {
    const response = await apiClient.get<ApiGoal[]>('/goals', { params });
    return response.data;
  },

  /**
   * Get goal details by ID
   */
  async get(id: string): Promise<ApiGoal> {
    const response = await apiClient.get<ApiGoal>(`/goals/${id}`);
    return response.data;
  },

  /**
   * Update an existing goal
   */
  async update(id: string, payload: GoalUpdate): Promise<ApiGoal> {
    const response = await apiClient.patch<ApiGoal>(`/goals/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a goal by ID
   */
  async delete(id: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/goals/${id}`);
    return response.data;
  },

  /**
   * Record a new contribution / deposit for a financial goal
   */
  async createContribution(
    goalId: string,
    payload: GoalContributionCreate
  ): Promise<GoalContribution> {
    const response = await apiClient.post<GoalContribution>(
      `/goals/${goalId}/contributions`,
      payload
    );
    return response.data;
  },

  /**
   * List all contribution ledger entries for a goal
   */
  async listContributions(goalId: string): Promise<GoalContribution[]> {
    const response = await apiClient.get<GoalContribution[]>(
      `/goals/${goalId}/contributions`
    );
    return response.data;
  },

  /**
   * Delete a contribution ledger record
   */
  async deleteContribution(
    goalId: string,
    contributionId: string
  ): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(
      `/goals/${goalId}/contributions/${contributionId}`
    );
    return response.data;
  },
};
