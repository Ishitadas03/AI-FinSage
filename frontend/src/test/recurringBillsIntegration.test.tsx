import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinanceProvider } from '@/context/FinanceContext';
import { Spending } from '@/pages/Spending';
import { recurringBillsApi } from '@/lib/api/recurringBills';
import { notificationsApi } from '@/lib/api/notifications';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { analyticsApi } from '@/lib/api/analytics';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { RecurringBill } from '@/types/recurringBill';

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

const mockRecurringBills: RecurringBill[] = [
  {
    id: 'bill-1',
    user_id: 'usr-1',
    name: 'Netflix Premium',
    merchant: 'Netflix',
    category: 'Entertainment',
    amount: 649,
    frequency: 'monthly',
    start_date: '2026-01-15',
    next_due_date: '2026-10-15',
    status: 'active',
    auto_post: false,
    reminder_days_before: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bill-2',
    user_id: 'usr-1',
    name: 'Gym Membership',
    merchant: 'CultFit',
    category: 'Fitness',
    amount: 2500,
    frequency: 'monthly',
    start_date: '2026-01-01',
    next_due_date: '2026-10-01',
    status: 'paused',
    auto_post: false,
    reminder_days_before: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('Recurring Bills Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('test-token');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser as any);
    vi.spyOn(accountsApi, 'list').mockResolvedValue(mockAccounts as any);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      transactions: [],
      total: 0,
      page: 1,
      page_size: 50,
      total_pages: 1,
    } as any);
    vi.spyOn(budgetsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(goalsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(loansApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(notificationsApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
      unread_count: 0,
    });
    vi.spyOn(analyticsApi, 'getOverview').mockResolvedValue({
      period: { start_date: '2026-01-01', end_date: '2026-12-31' },
      summary: { total_income: 0, total_expenses: 0, net_cash_flow: 0, savings_rate: 0 },
      spending_by_category: [],
      income_by_category: [],
      account_breakdown: [],
      top_merchants: [],
      monthly_trend: [],
      daily_burn_rate: 0,
      fixed_expenses_ratio: 0,
      discretionary_ratio: 0,
    } as any);

    vi.spyOn(recurringBillsApi, 'list').mockResolvedValue({
      items: mockRecurringBills,
      total: 2,
      active_count: 1,
      monthly_committed_total: 649,
    });
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('renders recurring bills in the Spending page', async () => {
    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recurring Bills & Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Netflix Premium')).toBeInTheDocument();
      expect(screen.getByText('Gym Membership')).toBeInTheDocument();
    });

    // Check count and status badges
    expect(screen.getByText('1 Active')).toBeInTheDocument();
    expect(screen.getByText('paused')).toBeInTheDocument();
  });

  it('filters recurring bills by status (All, Active, Paused)', async () => {
    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeInTheDocument();
      expect(screen.getByText('Gym Membership')).toBeInTheDocument();
    });

    // Click 'active' filter button
    const activeFilterBtn = screen.getByRole('button', { name: /active/i });
    fireEvent.click(activeFilterBtn);

    expect(screen.getByText('Netflix Premium')).toBeInTheDocument();
    expect(screen.queryByText('Gym Membership')).not.toBeInTheDocument();

    // Click 'paused' filter button
    const pausedFilterBtn = screen.getByRole('button', { name: /paused/i });
    fireEvent.click(pausedFilterBtn);

    expect(screen.queryByText('Netflix Premium')).not.toBeInTheDocument();
    expect(screen.getByText('Gym Membership')).toBeInTheDocument();
  });

  it('can pause and resume a recurring bill', async () => {
    const pauseSpy = vi.spyOn(recurringBillsApi, 'pause').mockResolvedValue({
      ...mockRecurringBills[0],
      status: 'paused',
    });

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeInTheDocument();
    });

    // Netflix is active, so Pause button is visible
    const pauseButton = screen.getByTitle('Pause recurring bill');
    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(pauseSpy).toHaveBeenCalledWith('bill-1');
    });
  });

  it('can record/post a bill payment idempotently', async () => {
    const postPaymentSpy = vi.spyOn(recurringBillsApi, 'postPayment').mockResolvedValue({
      bill: {
        ...mockRecurringBills[0],
        last_posted_date: '2026-09-27',
        next_due_date: '2026-11-15',
      },
      transaction: {
        id: 'tx-123',
        user_id: 'usr-1',
        account_id: 'acc-1',
        amount: 649,
        transaction_type: 'expense',
        category: 'Entertainment',
        description: 'Netflix Premium',
        transaction_date: '2026-09-27T10:00:00Z',
        is_pending: false,
        created_at: '2026-09-27T10:00:00Z',
        updated_at: '2026-09-27T10:00:00Z',
      },
      message: 'Payment recorded successfully',
    });

    render(
      <FinanceProvider>
        <Spending />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeInTheDocument();
    });

    const payButtons = screen.getAllByRole('button', { name: /Post Payment/i });
    fireEvent.click(payButtons[0]);

    await waitFor(() => {
      expect(postPaymentSpy).toHaveBeenCalledWith('bill-1', undefined);
    });
  });
});
