import { apiClient } from './client';
import { ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse } from '@/types/copilot';

/**
 * Grounded AI Copilot API Client (Phase 4)
 * - POST /api/v1/copilot/chat
 * - GET /api/v1/copilot/history
 * - DELETE /api/v1/copilot/history
 */
export const copilotApi = {
  /**
   * Send a question to the Grounded AI Copilot
   */
  async chat(payload: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await apiClient.post<ChatMessageResponse>('/copilot/chat', payload);
    return response.data;
  },

  /**
   * Get user chat history
   */
  async getHistory(limit: number = 50): Promise<ChatHistoryResponse> {
    const response = await apiClient.get<ChatHistoryResponse>(`/copilot/history?limit=${limit}`);
    return response.data;
  },

  /**
   * Clear user conversation history
   */
  async clearHistory(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/copilot/history');
    return response.data;
  },
};
