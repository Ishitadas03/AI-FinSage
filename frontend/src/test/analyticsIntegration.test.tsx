import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinanceProvider } from '@/context/FinanceContext';
import { Spending } from '@/pages/Spending';
import { analyticsApi } from '@/lib/api/analytics';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { AnalyticsOverviewResponse } from '@/types/analytics';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  created_at: '2026-01-01T00:00:00Z',
};

const mockAccounts = [
  {
    id: 'acc-1',
    user_id: 'usr-1',
    name: 'HDFC Salary Account',
    account_type: 'savings',
    currency: 'INR',
    balance: 145000,
    current_balance: 145000,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockAnalyticsResponse: AnalyticsOverviewResponse = {
  period: {
    start_date: '2026-04-01T00:00:00Z',
    end_date: '2026-09-30T23:59:59Z',
  },
  summary: {
    total_income: 510000,
    total_expenses: 325200,
    net_cash_flow: 184800,
    savings_rate: 36.2,
  },
  spending_by_category: [
    { category: 'Housing', amount: 108000, percentage: 33.2 },
    { category: 'Dining & Food', amount: 55200, percentage: 17.0 },
    { category: 'Utilities', amount: 32000, percentage: 9.8 },
  ],
  income_by_category: [
    { category: 'Salary', amount: 510000, percentage: 100 },
  ],
  account_breakdown: [
    {
      account_id: 'acc-1',
      account_name: 'HDFC Salary Account',
      account_type: 'savings',
      income: 510000,
      expenses: 325200,
      net_cash_flow: 184800,
    },
  ],
  trend: [
    { period: '2026-04', income: 85000, expenses: 54000, net_cash_flow: 31000 },
    { period: '2026-05', income: 85000, expenses: 52000, net_cash_flow: 33000 },
  ],
  top_expenses: [
    {
      id: 'tx-1',
      amount: 18000,
      category: 'Housing',
      merchant: 'Prestige Apartments',
      description: 'Monthly rent transfer',
      transaction_date: '2026-09-01T10:00:00Z',
      account_id: 'acc-1',
      account_name: 'HDFC Salary Account',
    },
    {
      id: 'tx-2',
      amount: 4500,
      category: 'Dining & Food',
      merchant: 'Swiggy Gourmet',
      description: 'Dinner delivery',
      transaction_date: '2026-09-12T19:30:00Z',
      account_id: 'acc-1',
      account_name: 'HDFC Salary Account',
    },
  ],
};

describe('Live Spending Analytics Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenStorage.setTokens('access-token-xyz', 'refresh-token-xyz');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(accountsApi, 'list').mockResolvedValue(mockAccounts);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
    vi.spyOn(budgetsApi, 'list').mockResolvedValue([]);
    vi.spyOn(goalsApi, 'list').mockResolvedValue([]);
    vi.spyOn(loansApi, 'list').mockResolvedValue([]);
    vi.spyOn(loansApi, 'getDebtStress').mockResolvedValue(null);
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('renders spending page and loads live analytics overview from backend', async () => {
    vi.spyOn(analyticsApi, 'getOverview').mockResolvedValue(mockAnalyticsResponse);

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Spending & Expense Analytics')).toBeInTheDocument();
      expect(screen.getByText('Housing')).toBeInTheDocument();
      expect(screen.getByText('Prestige Apartments')).toBeInTheDocument();
      expect(screen.getByText('Swiggy Gourmet')).toBeInTheDocument();
    });

    expect(analyticsApi.getOverview).toHaveBeenCalled();
  });

  it('filters spending by time range and triggers backend query with updated date window', async () => {
    vi.spyOn(analyticsApi, 'getOverview').mockResolvedValue(mockAnalyticsResponse);

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Spending & Expense Analytics')).toBeInTheDocument();
    });

    const timeSelect = screen.getByLabelText(/filter spending by time range/i);
    fireEvent.change(timeSelect, { target: { value: 'this_month' } });

    await waitFor(() => {
      expect(analyticsApi.getOverview).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: expect.any(String),
          end_date: expect.any(String),
        })
      );
    });
  });

  it('filters spending by account and passes account_id to backend', async () => {
    vi.spyOn(analyticsApi, 'getOverview').mockResolvedValue(mockAnalyticsResponse);

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('HDFC Salary Account (savings)')).toBeInTheDocument();
    });

    const accountSelect = screen.getByLabelText(/filter spending by account/i);
    fireEvent.change(accountSelect, { target: { value: 'acc-1' } });

    await waitFor(() => {
      expect(analyticsApi.getOverview).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 'acc-1',
        })
      );
    });
  });

  it('displays empty state when backend returns no spending data', async () => {
    const emptyResponse: AnalyticsOverviewResponse = {
      period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-09-30T23:59:59Z' },
      summary: { total_income: 0, total_expenses: 0, net_cash_flow: 0, savings_rate: 0 },
      spending_by_category: [],
      income_by_category: [],
      account_breakdown: [],
      trend: [],
      top_expenses: [],
    };

    vi.spyOn(analyticsApi, 'getOverview').mockResolvedValue(emptyResponse);

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No spending transactions in this range')).toBeInTheDocument();
    });
  });

  it('displays error message and retry button on backend failure without fake fallback data', async () => {
    vi.spyOn(analyticsApi, 'getOverview').mockRejectedValueOnce(new Error('Internal server error'));

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
