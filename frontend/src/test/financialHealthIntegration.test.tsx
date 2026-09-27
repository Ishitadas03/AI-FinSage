import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinanceProvider } from '@/context/FinanceContext';
import { FinancialHealth } from '@/pages/FinancialHealth';
import { financialHealthApi } from '@/lib/api/financialHealth';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { FinancialHealthOverviewResponse } from '@/types/financialHealth';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  created_at: '2026-01-01T00:00:00Z',
};

const mockHealthResponse: FinancialHealthOverviewResponse = {
  start_date: '2026-06-01',
  end_date: '2026-09-01',
  days_in_period: 92,
  liquid_assets: 350000,
  credit_card_debt: 25000,
  investment_assets: 850000,
  total_assets: 1200000,
  total_income: 255000,
  total_expenses: 162600,
  net_cashflow: 92400,
  total_outstanding_loan_principal: 1850000,
  total_monthly_emi: 18200,
  active_loan_count: 1,
  savings_rate: {
    value: 36.2,
    unit: '%',
    status: 'healthy',
    benchmark: '>= 20% of net income',
    explanation: 'Savings rate of 36.2% exceeds standard 20% target.',
  },
  expense_ratio: {
    value: 63.8,
    unit: '%',
    status: 'healthy',
    benchmark: '<= 70% of gross income',
    explanation: 'Expenses are well controlled at 63.8% of income.',
  },
  emergency_fund_coverage_months: {
    value: 5.9,
    unit: 'months',
    status: 'healthy',
    benchmark: '3 - 6 months of expenses',
    explanation: 'Liquid reserves cover 5.9 months of expenses.',
  },
  debt_to_liquid_ratio: {
    value: 7.1,
    unit: '%',
    status: 'healthy',
    benchmark: '<= 50% of liquid assets',
    explanation: 'Credit card debt is well backed by liquid assets.',
  },
  investment_allocation_ratio: {
    value: 70.8,
    unit: '%',
    status: 'healthy',
    benchmark: '>= 20% of net worth',
    explanation: 'Robust investment asset allocation.',
  },
  credit_card_utilization: {
    value: 12.5,
    unit: '%',
    status: 'healthy',
    benchmark: '< 30% of total limit',
    explanation: 'Card utilization is disciplined at 12.5%.',
  },
  debt_to_income_ratio: {
    value: 21.4,
    unit: '%',
    status: 'healthy',
    benchmark: '<= 35% of gross monthly income',
    explanation: 'DTI ratio is within prime lending thresholds.',
  },
  credit_card_details: [],
  data_completeness_notes: ['Record additional accounts to track overall wealth diversification.'],
};

describe('Live Financial Health Diagnostic Integration', () => {
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
    vi.spyOn(goalsApi, 'list').mockResolvedValue([]);
    vi.spyOn(loansApi, 'list').mockResolvedValue([]);
    vi.spyOn(loansApi, 'getDebtStress').mockResolvedValue(null);
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('renders live financial health overview and displays calculated metrics', async () => {
    vi.spyOn(financialHealthApi, 'getOverview').mockResolvedValue(mockHealthResponse);

    render(
      <FinanceProvider>
        <FinancialHealth />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Financial Health Diagnostic & Benchmark')).toBeInTheDocument();
      expect(screen.getByText('Savings Discipline')).toBeInTheDocument();
      expect(screen.getByText('Emergency Readiness')).toBeInTheDocument();
      expect(screen.getByText('Credit Card Utilization')).toBeInTheDocument();
    });

    expect(financialHealthApi.getOverview).toHaveBeenCalled();
  });

  it('displays data completeness notes returned by the backend', async () => {
    vi.spyOn(financialHealthApi, 'getOverview').mockResolvedValue(mockHealthResponse);

    render(
      <FinanceProvider>
        <FinancialHealth />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Data Completeness Diagnostics')).toBeInTheDocument();
      expect(screen.getByText('Record additional accounts to track overall wealth diversification.')).toBeInTheDocument();
    });
  });

  it('handles insufficient data metrics transparently without inventing fake scores', async () => {
    const insufficientResponse: FinancialHealthOverviewResponse = {
      ...mockHealthResponse,
      savings_rate: {
        value: null,
        unit: '%',
        status: 'insufficient_data',
        explanation: 'Insufficient transaction history to calculate savings rate.',
      },
      emergency_fund_coverage_months: {
        value: null,
        unit: 'months',
        status: 'insufficient_data',
        explanation: 'No liquid accounts found.',
      },
    };

    vi.spyOn(financialHealthApi, 'getOverview').mockResolvedValue(insufficientResponse);

    render(
      <FinanceProvider>
        <FinancialHealth />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Insufficient Data').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders error state with retry button on API failure without mock fallback', async () => {
    vi.spyOn(financialHealthApi, 'getOverview').mockRejectedValueOnce(new Error('Network connectivity issue'));

    render(
      <FinanceProvider>
        <FinancialHealth />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Network connectivity issue')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
