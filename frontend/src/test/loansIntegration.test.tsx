import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinanceProvider } from '@/context/FinanceContext';
import { DebtEMI } from '@/pages/DebtEMI';
import { loansApi } from '@/lib/api/loans';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { ApiLoan } from '@/types/loan';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  created_at: '2026-01-01T00:00:00Z',
};

const mockLoans: ApiLoan[] = [
  {
    id: 'l-1',
    user_id: 'usr-1',
    name: 'Green Valley Home Loan',
    principal_amount: 2500000,
    outstanding_principal: 1850000,
    interest_rate: 8.65,
    tenure_months: 142,
    monthly_emi: 18200,
    start_date: '2023-01-10',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockDebtStress = {
  overall_stress_score: 20,
  stress_level: 'low',
  total_outstanding_debt: 1850000,
  total_monthly_emi: 18200,
  dti_ratio: 21.4,
  monthly_income: 85000,
  debt_breakdown: [],
  stress_factors: [],
  recommendations: [],
};

describe('Debt & Loans Integration Page', () => {
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
    vi.spyOn(loansApi, 'getDebtStress').mockResolvedValue(mockDebtStress);
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('renders loans page and fetches loans from backend', async () => {
    vi.spyOn(loansApi, 'list').mockResolvedValueOnce(mockLoans);

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Debt & EMI Optimization')).toBeInTheDocument();
      expect(screen.getByText('Green Valley Home Loan')).toBeInTheDocument();
    });

    expect(loansApi.list).toHaveBeenCalled();
  });

  it('opens AddLoanModal and submits a new loan to backend', async () => {
    const newLoan: ApiLoan = {
      id: 'l-2',
      user_id: 'usr-1',
      name: 'New Car Loan',
      principal_amount: 500000,
      outstanding_principal: 500000,
      interest_rate: 9.0,
      tenure_months: 60,
      monthly_emi: 10379,
      start_date: '2026-09-01',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    };

    vi.spyOn(loansApi, 'list').mockResolvedValueOnce(mockLoans).mockResolvedValueOnce([...mockLoans, newLoan]);
    vi.spyOn(loansApi, 'create').mockResolvedValueOnce(newLoan);

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Green Valley Home Loan')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add Loan/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Loan')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Green Valley Home Loan'), {
      target: { value: 'New Car Loan' },
    });
    fireEvent.change(screen.getByPlaceholderText('2500000'), {
      target: { value: '500000' },
    });
    fireEvent.change(screen.getByPlaceholderText('8.65'), {
      target: { value: '9.0' },
    });
    fireEvent.change(screen.getByPlaceholderText('180'), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByPlaceholderText('18200'), {
      target: { value: '10379' },
    });

    const submitBtn = screen.getByRole('button', { name: /Create Loan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loansApi.create).toHaveBeenCalled();
    });
  });

  it('handles backend loan error gracefully', async () => {
    vi.spyOn(loansApi, 'list').mockRejectedValueOnce(new Error('Failed to load loans.'));

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load loans.')).toBeInTheDocument();
    });
  });
});
