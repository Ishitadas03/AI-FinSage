import { apiClient } from './client';
import {
  ApiTransaction,
  TransactionCreate,
  TransactionFilterParams,
  TransactionPaginatedResponse,
  TransactionUpdate,
} from '@/types/transaction';
import { MessageResponse } from '@/types/auth';

/**
 * Transactions API Service
 * Interacts directly with FastAPI backend:
 * - POST   /api/v1/transactions
 * - GET    /api/v1/transactions (with query params)
 * - GET    /api/v1/transactions/{id}
 * - PATCH  /api/v1/transactions/{id}
 * - DELETE /api/v1/transactions/{id}
 */
export const transactionsApi = {
  /**
   * Create a new transaction
   */
  async create(payload: TransactionCreate): Promise<ApiTransaction> {
    const response = await apiClient.post<ApiTransaction>('/transactions', payload);
    return response.data;
  },

  /**
   * List transactions with filtering and pagination
   */
  async list(params?: TransactionFilterParams): Promise<TransactionPaginatedResponse> {
    const query: Record<string, string | number> = {};

    if (params) {
      if (params.account_id) query.account_id = params.account_id;
      if (params.transaction_type) query.transaction_type = params.transaction_type;
      if (params.category) query.category = params.category;
      if (params.merchant) query.merchant = params.merchant;
      if (params.start_date) query.start_date = params.start_date;
      if (params.end_date) query.end_date = params.end_date;
      if (params.min_amount !== undefined) query.min_amount = params.min_amount;
      if (params.max_amount !== undefined) query.max_amount = params.max_amount;
      if (params.page !== undefined) query.page = params.page;
      if (params.page_size !== undefined) query.page_size = params.page_size;
    }

    const response = await apiClient.get<TransactionPaginatedResponse>('/transactions', {
      params: query,
    });
    return response.data;
  },

  /**
   * Get transaction details by ID
   */
  async get(id: string): Promise<ApiTransaction> {
    const response = await apiClient.get<ApiTransaction>(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Partially update an existing transaction
   */
  async update(id: string, payload: TransactionUpdate): Promise<ApiTransaction> {
    const response = await apiClient.patch<ApiTransaction>(`/transactions/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a transaction by ID
   */
  async delete(id: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/transactions/${id}`);
    return response.data;
  },
};
