import { apiClient } from './client';
import { Account, AccountCreate, AccountUpdate } from '@/types/account';
import { MessageResponse } from '@/types/auth';

/**
 * Accounts API Service
 * Interacts directly with FastAPI backend:
 * - POST   /api/v1/accounts
 * - GET    /api/v1/accounts
 * - GET    /api/v1/accounts/{id}
 * - PATCH  /api/v1/accounts/{id}
 * - DELETE /api/v1/accounts/{id}
 */
export const accountsApi = {
  /**
   * Create a new financial account
   */
  async create(payload: AccountCreate): Promise<Account> {
    const response = await apiClient.post<Account>('/accounts', payload);
    return response.data;
  },

  /**
   * List all accounts for the authenticated user
   */
  async list(): Promise<Account[]> {
    const response = await apiClient.get<Account[]>('/accounts');
    return response.data;
  },

  /**
   * Get account details by ID
   */
  async get(id: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  /**
   * Update an existing account
   */
  async update(id: string, payload: AccountUpdate): Promise<Account> {
    const response = await apiClient.patch<Account>(`/accounts/${id}`, payload);
    return response.data;
  },

  /**
   * Delete an account by ID
   */
  async delete(id: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/accounts/${id}`);
    return response.data;
  },
};
