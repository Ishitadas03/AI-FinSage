import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { loansApi } from '@/lib/api/loans';

describe('loansApi Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists user loans', async () => {
    const mockLoans = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174999',
        name: 'Home Loan',
        principal_amount: 2500000,
        outstanding_principal: 1850000,
        interest_rate: 8.65,
        tenure_months: 180,
        monthly_emi: 18200,
        start_date: '2023-01-10',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const spy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockLoans });

    const result = await loansApi.list();

    expect(spy).toHaveBeenCalledWith('/loans');
    expect(result).toEqual(mockLoans);
  });

  it('creates a new loan', async () => {
    const newLoanPayload = {
      name: 'Car Loan',
      principal_amount: 600000,
      outstanding_principal: 600000,
      interest_rate: 9.2,
      tenure_months: 60,
      monthly_emi: 12500,
      start_date: '2026-01-15',
    };

    const createdLoan = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      user_id: '123e4567-e89b-12d3-a456-426614174999',
      ...newLoanPayload,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    };

    const spy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: createdLoan });

    const result = await loansApi.create(newLoanPayload);

    expect(spy).toHaveBeenCalledWith('/loans', newLoanPayload);
    expect(result).toEqual(createdLoan);
  });

  it('updates an existing loan', async () => {
    const loanId = '123e4567-e89b-12d3-a456-426614174000';
    const updatePayload = { outstanding_principal: 1700000 };
    const updatedLoan = { id: loanId, ...updatePayload };

    const spy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: updatedLoan });

    const result = await loansApi.update(loanId, updatePayload);

    expect(spy).toHaveBeenCalledWith(`/loans/${loanId}`, updatePayload);
    expect(result).toEqual(updatedLoan);
  });

  it('deletes a loan', async () => {
    const loanId = '123e4567-e89b-12d3-a456-426614174000';
    const spy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { message: 'Loan deleted' } });

    const result = await loansApi.delete(loanId);

    expect(spy).toHaveBeenCalledWith(`/loans/${loanId}`);
    expect(result).toBe(true);
  });

  it('calculates EMI via endpoint', async () => {
    const payload = {
      principal_amount: 2500000,
      annual_interest_rate: 8.65,
      tenure_months: 180,
    };
    const responseData = {
      ...payload,
      monthly_emi: 24840.45,
      total_interest: 1971281.0,
      total_payment: 4471281.0,
    };

    const spy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: responseData });

    const result = await loansApi.calculateEmi(payload);

    expect(spy).toHaveBeenCalledWith('/emi/calculate', payload);
    expect(result).toEqual(responseData);
  });

  it('fetches debt stress overview', async () => {
    const mockOverview = {
      overall_stress_score: 25,
      stress_level: 'low',
      total_outstanding_debt: 1850000,
      total_monthly_emi: 18200,
      dti_ratio: 21.4,
      monthly_income: 85000,
      debt_breakdown: [],
      stress_factors: [],
      recommendations: [],
    };

    const spy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockOverview });

    const result = await loansApi.getDebtStress();

    expect(spy).toHaveBeenCalledWith('/debt-stress/overview', { params: undefined });
    expect(result).toEqual(mockOverview);
  });
});
