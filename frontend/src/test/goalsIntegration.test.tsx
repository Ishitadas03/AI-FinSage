import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FinanceProvider } from '@/context/FinanceContext';
import { goalsApi } from '@/lib/api/goals';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { ApiGoal } from '@/types/goal';
import { Goals } from '@/pages/Goals';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  is_active: true,
  created_at: '2026-09-25T12:00:00Z',
  updated_at: null,
};

const mockGoals: ApiGoal[] = [
  {
    id: 'goal-1',
    user_id: 'usr-1',
    name: 'Emergency Reserve',
    goal_type: 'emergency_fund',
    target_amount: 300000,
    current_amount: 180000,
    target_date: '2028-12-31',
    priority: 'high',
    status: 'active',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
    derived_state: {
      progress_percentage: 60,
      remaining_amount: 120000,
      remaining_months: 27,
      required_monthly_contribution: 4444.44,
      is_overdue: false,
      is_on_track: true,
      contribution_total: 180000,
      has_contribution_history: true,
    },
  },
  {
    id: 'goal-2',
    user_id: 'usr-1',
    name: 'Car Purchase Fund',
    goal_type: 'vehicle',
    target_amount: 800000,
    current_amount: 800000,
    target_date: '2028-12-31',
    priority: 'medium',
    status: 'completed',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
    derived_state: {
      progress_percentage: 100,
      remaining_amount: 0,
      remaining_months: 27,
      required_monthly_contribution: 0,
      is_overdue: false,
      is_on_track: true,
      contribution_total: 800000,
      has_contribution_history: true,
    },
  },
];

describe('Goals Integration & UI Page', () => {
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
    vi.spyOn(budgetsApi, 'list').mockResolvedValue([]);
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('renders goals page and loads goals from backend', async () => {
    const listSpy = vi.spyOn(goalsApi, 'list').mockResolvedValueOnce(mockGoals);

    render(
      <FinanceProvider>
        <Goals />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
    });

    expect(await screen.findByText('Emergency Reserve')).toBeInTheDocument();
    expect(screen.getByText('Active Goals (1)')).toBeInTheDocument();
  });

  it('records deposit into goal via backend API call', async () => {
    vi.spyOn(goalsApi, 'list').mockResolvedValue(mockGoals);
    const contribSpy = vi.spyOn(goalsApi, 'createContribution').mockResolvedValueOnce({
      id: 'contrib-1',
      goal_id: 'goal-1',
      user_id: 'usr-1',
      amount: 10000,
      contribution_date: '2026-09-26',
      note: 'Deposit',
      created_at: '2026-09-26T10:00:00Z',
    });

    render(
      <FinanceProvider>
        <Goals />
      </FinanceProvider>
    );

    expect(await screen.findByText('Emergency Reserve')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add Funds/i }));

    const depositInput = await screen.findByPlaceholderText(/₹ 10,000/i);
    fireEvent.change(depositInput, { target: { value: '10000' } });

    const submitBtn = screen.getByRole('button', { name: /Deposit & Allocate/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contribSpy).toHaveBeenCalledWith('goal-1', expect.objectContaining({
        amount: 10000,
      }));
    });
  });

  it('handles backend goals load errors gracefully', async () => {
    vi.spyOn(goalsApi, 'list').mockRejectedValueOnce(new Error('Failed to load goals from backend'));

    render(
      <FinanceProvider>
        <Goals />
      </FinanceProvider>
    );

    expect(await screen.findByText('Failed to load goals from backend')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });
});
