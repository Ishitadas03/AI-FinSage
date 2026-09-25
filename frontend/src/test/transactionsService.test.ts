import { describe, it, expect, beforeEach, vi } from 'vitest';
import { transactionsApi } from '@/lib/api/transactions';
import { apiClient } from '@/lib/api/client';
import {
  ApiTransaction,
  TransactionCreate,
  TransactionFilterParams,
  TransactionPaginatedResponse,
  TransactionUpdate,
} from '@/types/transaction';

describe('Transactions API Service', () => {
  const mockTx: ApiTransaction = {
    id: 'tx-uuid-1',
    user_id: 'usr-uuid-1',
    account_id: 'acc-uuid-1',
    destination_account_id: null,
    amount: 1500,
    transaction_type: 'expense',
    category: 'food',
    merchant: 'Swiggy',
    description: 'Dinner delivery',
    reference: null,
    source: 'manual',
    import_fingerprint: null,
    transaction_date: '2026-09-25T19:30:00Z',
    created_at: '2026-09-25T19:30:00Z',
    updated_at: '2026-09-25T19:30:00Z',
  };

  const mockPaginatedResponse: TransactionPaginatedResponse = {
    items: [mockTx],
    total: 1,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a transaction via POST /transactions', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockTx,
    });

    const payload: TransactionCreate = {
      account_id: 'acc-uuid-1',
      amount: 1500,
      transaction_type: 'expense',
      category: 'food',
      merchant: 'Swiggy',
      transaction_date: '2026-09-25T19:30:00Z',
    };

    const result = await transactionsApi.create(payload);
    expect(postSpy).toHaveBeenCalledWith('/transactions', payload);
    expect(result).toEqual(mockTx);
  });

  it('lists transactions without query params via GET /transactions', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockPaginatedResponse,
    });

    const result = await transactionsApi.list();
    expect(getSpy).toHaveBeenCalledWith('/transactions', { params: {} });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('properly serializes all supported query filter parameters', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockPaginatedResponse,
    });

    const filters: TransactionFilterParams = {
      account_id: 'acc-uuid-1',
      transaction_type: 'expense',
      category: 'food',
      merchant: 'Swiggy',
      start_date: '2026-09-01T00:00:00Z',
      end_date: '2026-09-30T23:59:59Z',
      min_amount: 100,
      max_amount: 5000,
      page: 2,
      page_size: 25,
    };

    await transactionsApi.list(filters);

    expect(getSpy).toHaveBeenCalledWith('/transactions', {
      params: {
        account_id: 'acc-uuid-1',
        transaction_type: 'expense',
        category: 'food',
        merchant: 'Swiggy',
        start_date: '2026-09-01T00:00:00Z',
        end_date: '2026-09-30T23:59:59Z',
        min_amount: 100,
        max_amount: 5000,
        page: 2,
        page_size: 25,
      },
    });
  });

  it('fetches a transaction by ID via GET /transactions/{id}', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockTx,
    });

    const result = await transactionsApi.get('tx-uuid-1');
    expect(getSpy).toHaveBeenCalledWith('/transactions/tx-uuid-1');
    expect(result.id).toBe('tx-uuid-1');
  });

  it('partially updates a transaction via PATCH /transactions/{id}', async () => {
    const updatedTx = { ...mockTx, merchant: 'Zomato', amount: 1800 };
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: updatedTx,
    });

    const payload: TransactionUpdate = { merchant: 'Zomato', amount: 1800 };
    const result = await transactionsApi.update('tx-uuid-1', payload);

    expect(patchSpy).toHaveBeenCalledWith('/transactions/tx-uuid-1', payload);
    expect(result.merchant).toBe('Zomato');
    expect(result.amount).toBe(1800);
  });

  it('deletes a transaction via DELETE /transactions/{id}', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { message: 'Transaction deleted successfully' },
    });

    const result = await transactionsApi.delete('tx-uuid-1');
    expect(deleteSpy).toHaveBeenCalledWith('/transactions/tx-uuid-1');
    expect(result.message).toBe('Transaction deleted successfully');
  });
});
