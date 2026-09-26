import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FinanceProvider } from '@/context/FinanceContext';
import { budgetsApi } from '@/lib/api/budgets';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { ApiBudget } from '@/types/budget';
import { Budgets } from '@/pages/Budgets';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  is_active: true,
  created_at: '2026-09-25T12:00:00Z',
  updated_at: null,
};

const mockBudgets: ApiBudget[] = [
  {
    id: 'bdg-1',
    user_id: 'usr-1',
    name: 'Food & Dining Cap',
    category: 'food',
    amount: 15000,
    period: 'monthly',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
    spending: {
      budget_id: 'bdg-1',
      budget_name: 'Food & Dining Cap',
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
  },
  {
    id: 'bdg-2',
    user_id: 'usr-1',
    name: 'Shopping Guardrail',
    category: 'shopping',
    amount: 10000,
    period: 'monthly',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
    spending: {
      budget_id: 'bdg-2',
      budget_name: 'Shopping Guardrail',
      category: 'shopping',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      budget_amount: 10000,
      actual_spending: 8800,
      remaining_amount: 1200,
      over_budget_amount: 0,
      spending_percentage: 88.0,
      status: 'warning',
    },
  },
];

describe('Budgets Integration & UI Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenStorage.setTokens('access-token-xyz', 'refresh-token-xyz');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(accountsApi, 'list').mockResolvedValue([]);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('renders budgets page and loads budgets from backend', async () => {
    const listSpy = vi.spyOn(budgetsApi, 'list').mockResolvedValueOnce(mockBudgets);

    render(
      <FinanceProvider>
        <Budgets />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
    });

    expect(await screen.findByText('Food & Dining Cap')).toBeInTheDocument();
    expect(screen.getByText('Shopping Guardrail')).toBeInTheDocument();
    expect(screen.getByText(/1 Category Budget Exceeding 80% Threshold/i)).toBeInTheDocument();
  });

  it('creates a new category budget via backend API call', async () => {
    vi.spyOn(budgetsApi, 'list').mockResolvedValueOnce([]);

    const newBudget: ApiBudget = {
      id: 'bdg-3',
      user_id: 'usr-1',
      name: 'Travel Cap',
      category: 'transport',
      amount: 5000,
      period: 'monthly',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      created_at: '2026-09-26T10:00:00Z',
      updated_at: '2026-09-26T10:00:00Z',
      spending: {
        budget_id: 'bdg-3',
        budget_name: 'Travel Cap',
        category: 'transport',
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        budget_amount: 5000,
        actual_spending: 0,
        remaining_amount: 5000,
        over_budget_amount: 0,
        spending_percentage: 0,
        status: 'healthy',
      },
    };

    const createSpy = vi.spyOn(budgetsApi, 'create').mockResolvedValueOnce(newBudget);

    render(
      <FinanceProvider>
        <Budgets />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No Category Budgets Set Up Yet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Budget Limit/i }));

    const nameInput = await screen.findByPlaceholderText(/e.g. Monthly Grocery Cap/i);
    fireEvent.change(nameInput, { target: { value: 'Travel Cap' } });

    const amountInput = screen.getByPlaceholderText(/₹ 10,000/i);
    fireEvent.change(amountInput, { target: { value: '5000' } });

    const submitBtn = screen.getByRole('button', { name: /Create Limit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Travel Cap',
          amount: 5000,
          category: 'food',
        })
      );
    });

    expect(await screen.findByText('Travel Cap')).toBeInTheDocument();
  });

  it('handles backend budget load errors gracefully', async () => {
    vi.spyOn(budgetsApi, 'list').mockRejectedValueOnce(new Error('Failed to connect to backend'));

    render(
      <FinanceProvider>
        <Budgets />
      </FinanceProvider>
    );

    expect(await screen.findByText('Failed to connect to backend')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });
});
