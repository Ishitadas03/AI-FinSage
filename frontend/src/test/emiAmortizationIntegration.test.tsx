import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinanceProvider } from '@/context/FinanceContext';
import { DebtEMI } from '@/pages/DebtEMI';
import { emiApi } from '@/lib/api/emi';
import { loansApi } from '@/lib/api/loans';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { AmortizationScheduleResponse } from '@/types/amortization';
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
    name: 'Home Loan Prime',
    principal_amount: 2500000,
    outstanding_principal: 2000000,
    interest_rate: 8.75,
    tenure_months: 180,
    monthly_emi: 20002,
    start_date: '2023-01-01',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockAmortizationResponse: AmortizationScheduleResponse = {
  principal_amount: 2000000,
  annual_interest_rate: 8.75,
  tenure_months: 180,
  monthly_emi: 20002.43,
  total_payment: 3600437.40,
  total_interest: 1600437.40,
  schedule: [
    {
      month_number: 1,
      opening_balance: 2000000,
      emi: 20002.43,
      principal_component: 5419.10,
      interest_component: 14583.33,
      closing_balance: 1994580.90,
    },
    {
      month_number: 2,
      opening_balance: 1994580.90,
      emi: 20002.43,
      principal_component: 5458.60,
      interest_component: 14543.83,
      closing_balance: 1989122.30,
    },
  ],
};

describe('EMI Amortization Schedule Integration', () => {
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
    vi.spyOn(loansApi, 'list').mockResolvedValue(mockLoans);
    vi.spyOn(loansApi, 'getDebtStress').mockResolvedValue(null);
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('generates and displays backend amortization schedule in interactive table', async () => {
    vi.spyOn(emiApi, 'getAmortizationSchedule').mockResolvedValue(mockAmortizationResponse);

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Deterministic EMI Amortization Schedule')).toBeInTheDocument();
      expect(screen.getByText('Month 1')).toBeInTheDocument();
      expect(screen.getByText('Month 2')).toBeInTheDocument();
    });

    expect(emiApi.getAmortizationSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        principal_amount: 2000000,
        annual_interest_rate: 8.75,
        tenure_months: 180,
      })
    );
  });

  it('supports quick loading loan parameters into amortization calculation', async () => {
    vi.spyOn(emiApi, 'getAmortizationSchedule').mockResolvedValue(mockAmortizationResponse);

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Home Loan Prime')).toBeInTheDocument();
    });

    const scheduleBtn = screen.getByRole('button', { name: /^schedule$/i });
    fireEvent.click(scheduleBtn);

    const calcBtn = screen.getByRole('button', { name: /^calculate schedule$/i });
    fireEvent.click(calcBtn);


    await waitFor(() => {
      expect(emiApi.getAmortizationSchedule).toHaveBeenCalled();
    });
  });

  it('triggers CSV download with generated schedule data', async () => {
    vi.spyOn(emiApi, 'getAmortizationSchedule').mockResolvedValue(mockAmortizationResponse);
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/mock-blob-url');
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = vi.fn();

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Month 1')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('handles backend amortization error gracefully', async () => {
    vi.spyOn(emiApi, 'getAmortizationSchedule').mockRejectedValueOnce({
      response: { data: { detail: 'Principal must be greater than 0.' } },
    });

    render(
      <FinanceProvider>
        <DebtEMI />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Principal must be greater than 0.')).toBeInTheDocument();
    });
  });
});
