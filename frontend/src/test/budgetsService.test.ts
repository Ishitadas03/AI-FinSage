import { describe, it, expect, beforeEach, vi } from 'vitest';
import { budgetsApi } from '@/lib/api/budgets';
import { apiClient } from '@/lib/api/client';
import { ApiBudget, BudgetCreate, BudgetUpdate } from '@/types/budget';

describe('Budgets API Service', () => {
  const mockBudget: ApiBudget = {
    id: 'bdg-uuid-1',
    user_id: 'usr-uuid-1',
    name: 'Food & Dining Limit',
    category: 'food',
    amount: 15000,
    period: 'monthly',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
    spending: {
      budget_id: 'bdg-uuid-1',
      budget_name: 'Food & Dining Limit',
      category: 'food',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      budget_amount: 15000,
      actual_spending: 9200,
      remaining_amount: 5800,
      over_budget_amount: 0,
      spending_percentage: 61.33,
      status: 'healthy',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a budget via POST /budgets', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBudget,
    });

    const payload: BudgetCreate = {
      name: 'Food & Dining Limit',
      category: 'food',
      amount: 15000,
      period: 'monthly',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
    };

    const result = await budgetsApi.create(payload);
    expect(postSpy).toHaveBeenCalledWith('/budgets', payload);
    expect(result).toEqual(mockBudget);
  });

  it('lists budgets via GET /budgets', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockBudget],
    });

    const result = await budgetsApi.list();
    expect(getSpy).toHaveBeenCalledWith('/budgets', { params: undefined });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Food & Dining Limit');
    expect(result[0].spending.actual_spending).toBe(9200);
  });

  it('fetches a single budget by ID via GET /budgets/{id}', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBudget,
    });

    const result = await budgetsApi.get('bdg-uuid-1');
    expect(getSpy).toHaveBeenCalledWith('/budgets/bdg-uuid-1');
    expect(result.id).toBe('bdg-uuid-1');
  });

  it('updates a budget via PATCH /budgets/{id}', async () => {
    const updatedBudget = { ...mockBudget, amount: 20000 };
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: updatedBudget,
    });

    const payload: BudgetUpdate = { amount: 20000 };
    const result = await budgetsApi.update('bdg-uuid-1', payload);

    expect(patchSpy).toHaveBeenCalledWith('/budgets/bdg-uuid-1', payload);
    expect(result.amount).toBe(20000);
  });

  it('deletes a budget via DELETE /budgets/{id}', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { message: 'Budget successfully deleted.' },
    });

    const result = await budgetsApi.delete('bdg-uuid-1');
    expect(deleteSpy).toHaveBeenCalledWith('/budgets/bdg-uuid-1');
    expect(result.message).toBe('Budget successfully deleted.');
  });

  it('fetches budget spending summary via GET /budgets/{id}/spending', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBudget.spending,
    });

    const result = await budgetsApi.getSpending('bdg-uuid-1');
    expect(getSpy).toHaveBeenCalledWith('/budgets/bdg-uuid-1/spending');
    expect(result.status).toBe('healthy');
  });

  it('propagates API errors on budget operations', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network Error'));

    await expect(
      budgetsApi.create({
        name: 'Fail',
        category: 'food',
        amount: 1000,
        start_date: '2026-09-01',
        end_date: '2026-09-30',
      })
    ).rejects.toThrow('Network Error');
  });
});
