import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { ApiLoan, LoanCreate } from '@/types/loan';
import { loansApi } from '@/lib/api/loans';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanToEdit?: ApiLoan | null;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  loanToEdit,
}) => {
  const { createLoan, updateLoan } = useFinance();

  const [name, setName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [outstandingPrincipal, setOutstandingPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingEmi, setIsCalculatingEmi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loanToEdit) {
      setName(loanToEdit.name || '');
      setPrincipalAmount(String(loanToEdit.principal_amount || ''));
      setOutstandingPrincipal(String(loanToEdit.outstanding_principal || ''));
      setInterestRate(String(loanToEdit.interest_rate || ''));
      setTenureMonths(String(loanToEdit.tenure_months || ''));
      setMonthlyEmi(String(loanToEdit.monthly_emi || ''));
      setStartDate(loanToEdit.start_date ? loanToEdit.start_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    } else {
      setName('');
      setPrincipalAmount('');
      setOutstandingPrincipal('');
      setInterestRate('');
      setTenureMonths('');
      setMonthlyEmi('');
      setStartDate(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [loanToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAutoCalculateEmi = async () => {
    const p = parseFloat(principalAmount);
    const r = parseFloat(interestRate);
    const t = parseInt(tenureMonths, 10);

    if (isNaN(p) || p <= 0 || isNaN(r) || r < 0 || isNaN(t) || t <= 0) {
      setError('Please provide valid Principal Amount, Interest Rate, and Tenure Months to auto-calculate EMI.');
      return;
    }

    setIsCalculatingEmi(true);
    setError(null);
    try {
      const res = await loansApi.calculateEmi({
        principal_amount: p,
        annual_interest_rate: r,
        tenure_months: t,
      });
      setMonthlyEmi(String(res.monthly_emi));
    } catch {
      setError('Failed to auto-calculate EMI from backend.');
    } finally {
      setIsCalculatingEmi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Loan name is required.');
      return;
    }

    const p = parseFloat(principalAmount);
    if (isNaN(p) || p <= 0) {
      setError('Principal amount must be greater than ₹0.');
      return;
    }

    let outP = parseFloat(outstandingPrincipal);
    if (isNaN(outP)) {
      outP = p;
    }
    if (outP < 0) {
      setError('Outstanding principal cannot be negative.');
      return;
    }
    if (outP > p) {
      setError('Outstanding principal cannot exceed principal amount.');
      return;
    }

    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 0) {
      setError('Interest rate must be 0 or positive.');
      return;
    }

    const tenure = parseInt(tenureMonths, 10);
    if (isNaN(tenure) || tenure <= 0) {
      setError('Tenure months must be greater than 0.');
      return;
    }

    const emi = parseFloat(monthlyEmi);
    if (isNaN(emi) || emi <= 0) {
      setError('Monthly EMI must be greater than ₹0.');
      return;
    }

    const payload: LoanCreate = {
      name: trimmedName,
      principal_amount: p,
      outstanding_principal: outP,
      interest_rate: rate,
      tenure_months: tenure,
      monthly_emi: emi,
      start_date: startDate,
    };

    setIsSubmitting(true);
    try {
      if (loanToEdit) {
        await updateLoan(loanToEdit.id, payload);
      } else {
        await createLoan(payload);
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to save loan record.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {loanToEdit ? 'Edit Loan Record' : 'Add New Loan'}
            </h2>
            <p className="text-xs text-slate-500">
              {loanToEdit
                ? 'Update loan terms, EMI, or outstanding principal'
                : 'Track your home loan, car loan, or personal debt'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Loan Name / Identifier *</label>
            <input
              type="text"
              required
              placeholder="e.g. Green Valley Home Loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Original Principal Amount (₹) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="2500000"
                value={principalAmount}
                onChange={(e) => {
                  setPrincipalAmount(e.target.value);
                  if (!outstandingPrincipal || !loanToEdit) {
                    setOutstandingPrincipal(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-numeric"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Outstanding Principal (₹) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="1850000"
                value={outstandingPrincipal}
                onChange={(e) => setOutstandingPrincipal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-numeric"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Annual Interest Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="8.65"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-numeric"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tenure (Months) *</label>
              <input
                type="number"
                required
                placeholder="180"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-numeric"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Monthly EMI (₹) *</label>
              <button
                type="button"
                onClick={handleAutoCalculateEmi}
                disabled={isCalculatingEmi}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 underline disabled:opacity-50"
              >
                {isCalculatingEmi ? 'Calculating...' : 'Auto-calculate EMI'}
              </button>
            </div>
            <input
              type="number"
              step="any"
              required
              placeholder="18200"
              value={monthlyEmi}
              onChange={(e) => setMonthlyEmi(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-numeric"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Disbursement Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {loanToEdit ? 'Save Changes' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
