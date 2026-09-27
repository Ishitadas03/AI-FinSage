import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceProvider } from '@/context/FinanceContext';
import { PWAInstallProvider } from '@/context/PWAInstallContext';
import { AIReport } from '@/pages/AIReport';
import { reportsApi } from '@/lib/api/reports';
import { authApi } from '@/lib/api/auth';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { recurringBillsApi } from '@/lib/api/recurringBills';
import { notificationsApi } from '@/lib/api/notifications';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { MonthlyFinancialReportResponse } from '@/types/monthlyReport';

const mockUser = {
  id: 'usr-report-1',
  email: 'reportuser@finsage.io',
  full_name: 'Sophia Patel',
  created_at: '2026-01-01T00:00:00Z',
};

const mockReport: MonthlyFinancialReportResponse = {
  period: {
    month_str: '2026-09',
    month_label: 'September 2026',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    is_current_month: true,
    days_in_month: 30,
    days_elapsed: 27,
  },
  summary: {
    total_income: 120000.0,
    total_expenses: 75000.0,
    net_savings: 45000.0,
    savings_rate: 37.5,
    burn_rate_daily: 2777.78,
    transaction_count: 14,
    active_accounts_count: 2,
  },
  comparison: {
    has_previous_period: true,
    previous_month_label: 'August 2026',
    previous_income: 100000.0,
    previous_expenses: 80000.0,
    previous_net_savings: 20000.0,
    previous_savings_rate: 20.0,
    income_change_pct: 20.0,
    expense_change_pct: -6.25,
    savings_change_pct: 125.0,
    is_incomplete_comparison: false,
  },
  categories: [
    { category: 'housing', amount: 40000.0, percentage_of_total: 53.33, transaction_count: 1 },
    { category: 'food', amount: 20000.0, percentage_of_total: 26.67, transaction_count: 8 },
    { category: 'utilities', amount: 15000.0, percentage_of_total: 20.0, transaction_count: 5 },
  ],
  top_expenses: [
    { id: 'tx-1', merchant: 'Urban Space Rent', category: 'housing', amount: 40000.0, date: '2026-09-05' },
    { id: 'tx-2', merchant: 'Supermarket Groceries', category: 'food', amount: 12000.0, date: '2026-09-10' },
  ],
  budget_audit: [
    { category: 'food', allocated: 15000.0, spent: 20000.0, remaining: 0.0, utilization_pct: 133.33, is_overrun: true, overrun_amount: 5000.0 },
    { category: 'utilities', allocated: 20000.0, spent: 15000.0, remaining: 5000.0, utilization_pct: 75.0, is_overrun: false, overrun_amount: 0.0 },
  ],
  upcoming_obligations: [
    { type: 'recurring_bill', name: 'High-Speed Broadband', amount: 1499.0, due_date: '2026-09-29', account_name: 'HDFC Checking', frequency: 'monthly' },
  ],
  financial_health: {
    score: 82,
    grade: 'A',
    metrics: { savings_rate: { value: 37.5, status: 'good' } },
  },
  executive_summary: 'In September 2026, total income reached ₹1,20,000 against living expenses of ₹75,000 with a 37.5% savings rate.',
  action_checklist: [
    { category: 'Budgeting', title: 'Contain Food Overrun', description: 'Food spending exceeded planned budget by ₹5,000.', priority: 'high' },
  ],
  missing_data_notes: [],
  generated_at: '2026-09-27T10:00:00Z',
};

describe('AI Monthly Report Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('test-token');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser as any);
    vi.spyOn(accountsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      transactions: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    } as any);
    vi.spyOn(budgetsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(goalsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(loansApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(recurringBillsApi, 'list').mockResolvedValue({ bills: [], total: 0, active_count: 0, total_monthly_committed: 0 } as any);
    vi.spyOn(notificationsApi, 'list').mockResolvedValue({ notifications: [], total: 0, unread_count: 0 } as any);

    vi.spyOn(reportsApi, 'getMonthlyReport').mockResolvedValue(mockReport);
  });

  it('fetches and renders dynamic monthly report on load', async () => {
    render(
      <PWAInstallProvider>
        <FinanceProvider>
          <AIReport />
        </FinanceProvider>
      </PWAInstallProvider>
    );

    await waitFor(() => {
      expect(reportsApi.getMonthlyReport).toHaveBeenCalled();
      expect(screen.getByText(/Executive Financial Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Contain Food Overrun/i)).toBeInTheDocument();
      expect(screen.getByText(/High-Speed Broadband/i)).toBeInTheDocument();
    });
  });

  it('triggers period change and updates report', async () => {
    render(
      <PWAInstallProvider>
        <FinanceProvider>
          <AIReport />
        </FinanceProvider>
      </PWAInstallProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2026-08' } });

    await waitFor(() => {
      expect(reportsApi.getMonthlyReport).toHaveBeenCalledWith('2026-08');
    });
  });
});
