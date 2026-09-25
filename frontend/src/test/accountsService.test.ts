import { describe, it, expect, beforeEach, vi } from 'vitest';
import { accountsApi } from '@/lib/api/accounts';
import { apiClient } from '@/lib/api/client';
import { Account, AccountCreate, AccountUpdate } from '@/types/account';

describe('Accounts API Service', () => {
  const mockAccount: Account = {
    id: 'acc-uuid-1',
    user_id: 'usr-uuid-1',
    name: 'HDFC Salary Account',
    account_type: 'savings',
    balance: 50000,
    current_balance: 50000,
    credit_limit: null,
    currency: 'INR',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an account via POST /accounts', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockAccount,
    });

    const payload: AccountCreate = {
      name: 'HDFC Salary Account',
      account_type: 'savings',
      balance: 50000,
      currency: 'INR',
    };

    const result = await accountsApi.create(payload);
    expect(postSpy).toHaveBeenCalledWith('/accounts', payload);
    expect(result).toEqual(mockAccount);
  });

  it('lists accounts via GET /accounts', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockAccount],
    });

    const result = await accountsApi.list();
    expect(getSpy).toHaveBeenCalledWith('/accounts');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('HDFC Salary Account');
  });

  it('fetches a single account by ID via GET /accounts/{id}', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockAccount,
    });

    const result = await accountsApi.get('acc-uuid-1');
    expect(getSpy).toHaveBeenCalledWith('/accounts/acc-uuid-1');
    expect(result.id).toBe('acc-uuid-1');
  });

  it('updates an account via PATCH /accounts/{id}', async () => {
    const updatedAccount = { ...mockAccount, name: 'HDFC Primary' };
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: updatedAccount,
    });

    const payload: AccountUpdate = { name: 'HDFC Primary' };
    const result = await accountsApi.update('acc-uuid-1', payload);

    expect(patchSpy).toHaveBeenCalledWith('/accounts/acc-uuid-1', payload);
    expect(result.name).toBe('HDFC Primary');
  });

  it('deletes an account via DELETE /accounts/{id}', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { message: 'Account deleted successfully' },
    });

    const result = await accountsApi.delete('acc-uuid-1');
    expect(deleteSpy).toHaveBeenCalledWith('/accounts/acc-uuid-1');
    expect(result.message).toBe('Account deleted successfully');
  });

  it('propagates API errors on account operations', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network error'));

    await expect(
      accountsApi.create({ name: 'Fail', account_type: 'savings' })
    ).rejects.toThrow('Network error');
  });
});
