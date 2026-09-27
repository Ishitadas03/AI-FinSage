import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Calculator,
  ShieldCheck,
  Zap,
  Building,
  Car,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Download,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, calculateEMI } from '@/lib/formatters';
import { ApiLoan } from '@/types/loan';
import { AmortizationScheduleResponse } from '@/types/amortization';
import { AddLoanModal } from '@/components/modals/AddLoanModal';

export const DebtEMI: React.FC = () => {
  const {
    loans,
    isLoadingLoans,
    loansError,
    loadLoans,
    deleteLoan,
    totalDebt,
    totalMonthlyEmi,
    emiToIncomeRatio,
    debtStress,
    simulatePrepayment,
    getAmortizationSchedule,
  } = useFinance();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<ApiLoan | null>(null);

  // EMI Calculator & Amortization Schedule Inputs
  const [calcPrincipal, setCalcPrincipal] = useState(2000000);
  const [calcRate, setCalcRate] = useState(8.75);
  const [calcTenureYears, setCalcTenureYears] = useState(15);

  // Amortization Schedule API state
  const [scheduleData, setScheduleData] = useState<AmortizationScheduleResponse | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const pageSize = 12; // 1 year per page for clean scannability

  // What-if Prepayment Simulator State
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [extraPrepayment, setExtraPrepayment] = useState(5000);

  // Effective selected loan ID (defaulting to first loan if available)
  const activeSelectedLoanId = selectedLoanId || loans[0]?.id || '';
  const selectedLoan = loans.find((l) => l.id === activeSelectedLoanId) || loans[0];

  // Calculated EMI for the standalone calculator
  const calculatorResult = useMemo(() => {
    return calculateEMI(calcPrincipal, calcRate, calcTenureYears * 12);
  }, [calcPrincipal, calcRate, calcTenureYears]);

  // Prepayment simulation result
  const prepayResult = useMemo(() => {
    if (!selectedLoan) return { interestSaved: 0, monthsSaved: 0, newTenureMonths: 0 };
    return simulatePrepayment(selectedLoan.id, extraPrepayment);
  }, [selectedLoan, extraPrepayment, simulatePrepayment]);

  // Payoff chart comparison data
  const payoffData = useMemo(() => {
    if (!selectedLoan) return [];

    const data = [];
    const months = Number(selectedLoan.tenure_months || 0);
    const newMonths = prepayResult.newTenureMonths || months;
    const initialPrincipal = Number(selectedLoan.outstanding_principal || 0);

    if (months <= 0 || initialPrincipal <= 0) return [];

    const totalYears = Math.ceil(months / 12);
    for (let yr = 0; yr <= totalYears; yr++) {
      const regularRemaining = Math.max(0, initialPrincipal * (1 - (yr * 12) / months));
      const acceleratedRemaining = Math.max(0, initialPrincipal * (1 - (yr * 12) / newMonths));

      data.push({
        year: `Year ${yr}`,
        regular: Math.round(regularRemaining),
        accelerated: Math.round(acceleratedRemaining),
      });
    }
    return data;
  }, [selectedLoan, prepayResult]);

  // Fetch backend-generated amortization schedule
  const fetchAmortization = useCallback(async () => {
    if (calcPrincipal <= 0 || calcRate < 0 || calcTenureYears <= 0) {
      setScheduleError('Please enter valid positive loan parameters.');
      return;
    }

    setIsLoadingSchedule(true);
    setScheduleError(null);
    try {
      const result = await getAmortizationSchedule({
        principal_amount: calcPrincipal,
        annual_interest_rate: calcRate,
        tenure_months: calcTenureYears * 12,
      });
      setScheduleData(result);
      setSchedulePage(1);
    } catch (err: any) {
      setScheduleError(err?.response?.data?.detail || 'Failed to generate backend amortization schedule.');
      setScheduleData(null);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [getAmortizationSchedule, calcPrincipal, calcRate, calcTenureYears]);

  // Auto-fetch schedule on initial mount
  useEffect(() => {
    fetchAmortization();
  }, [fetchAmortization]);

  // Quick populate inputs from a user loan
  const handleQuickLoadLoan = (loan: ApiLoan) => {
    setCalcPrincipal(Number(loan.outstanding_principal || loan.principal_amount));
    setCalcRate(Number(loan.interest_rate));
    setCalcTenureYears(Math.max(1, Math.round(Number(loan.tenure_months) / 12)));
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!scheduleData || !scheduleData.schedule || scheduleData.schedule.length === 0) return;

    const headers = ['Month', 'Opening Balance (INR)', 'EMI (INR)', 'Principal Component (INR)', 'Interest Component (INR)', 'Closing Balance (INR)'];
    const rows = scheduleData.schedule.map((item) => [
      item.month_number,
      Number(item.opening_balance).toFixed(2),
      Number(item.emi).toFixed(2),
      Number(item.principal_component).toFixed(2),
      Number(item.interest_component).toFixed(2),
      Number(item.closing_balance).toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Amortization_Schedule_${calcPrincipal}_${calcRate}pct.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAddModal = () => {
    setLoanToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (loan: ApiLoan) => {
    setLoanToEdit(loan);
    setIsAddModalOpen(true);
  };

  const handleDeleteLoan = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      await deleteLoan(id);
    }
  };

  // Paginated schedule view
  const paginatedSchedule = useMemo(() => {
    if (!scheduleData || !scheduleData.schedule) return [];
    const start = (schedulePage - 1) * pageSize;
    return scheduleData.schedule.slice(start, start + pageSize);
  }, [scheduleData, schedulePage]);

  const totalSchedulePages = useMemo(() => {
    if (!scheduleData || !scheduleData.schedule) return 1;
    return Math.ceil(scheduleData.schedule.length / pageSize);
  }, [scheduleData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-teal-700" />
            Debt & EMI Optimization
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accelerate debt freedom, simulate principal prepayments, and inspect backend-generated amortization schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>
              EMI-to-Income: {emiToIncomeRatio}% {debtStress ? `(${debtStress.stress_level.toUpperCase()})` : '(Healthy <35%)'}
            </span>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Loan</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {loansError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3 text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{loansError}</span>
          </div>
          <button
            onClick={() => loadLoans()}
            className="rounded-lg bg-rose-100 px-3 py-1 text-rose-800 font-bold hover:bg-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Outstanding Principal</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalDebt)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {loans.length} active liability accounts</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Monthly Committed EMI</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalMonthlyEmi)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Due each month across all loans</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">EMI-to-Income Burden</span>
          <div className="mt-2 text-xl font-bold text-emerald-800 font-numeric">
            {emiToIncomeRatio}%
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {emiToIncomeRatio <= 35 ? 'Comfortable (<35% threshold)' : 'Elevated (>35% threshold)'}
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Potential Prepayment Savings</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {formatCurrency(prepayResult.interestSaved)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            +{prepayResult.monthsSaved} months faster payoff
          </p>
        </div>
      </div>

      {/* 2-Column Section: Active Loans Table (7 cols) + Prepayment Simulator & Calculator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Loans Management Table */}
        <div className="lg:col-span-7 card-fintech p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Loans & Liabilities</h3>
            <span className="text-xs text-slate-400">{loans.length} Registered</span>
          </div>

          {isLoadingLoans && loans.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
              <span className="text-xs">Loading loans...</span>
            </div>
          ) : loans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-xs font-medium">No loans recorded yet.</p>
              <button
                onClick={handleOpenAddModal}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                + Add your first loan to begin tracking
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => {
                const isSelected = loan.id === activeSelectedLoanId;
                const principal = Number(loan.outstanding_principal || loan.principal_amount);
                const originalPrincipal = Number(loan.principal_amount);
                const progressPct = originalPrincipal > 0
                  ? Math.min(100, Math.max(0, Math.round(((originalPrincipal - principal) / originalPrincipal) * 100)))
                  : 0;

                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoanId(loan.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-teal-300 bg-teal-50/40 shadow-sm'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-100">
                          {loan.loan_type === 'home' ? (
                            <Building className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Car className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{loan.name}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">{loan.lender}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            EMI: {formatCurrency(Number(loan.monthly_emi))}/mo • {loan.interest_rate}% p.a. • {loan.tenure_months} mos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickLoadLoan(loan);
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold hover:bg-teal-100 transition-colors"
                          title="Load parameters into Amortization Schedule"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(loan);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
                          title="Edit Loan"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLoan(loan.id, loan.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white"
                          title="Delete Loan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Loan Payoff Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Balance: {formatCurrency(principal)}</span>
                        <span>{progressPct}% Paid Off</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prepayment Simulator */}
        <div className="lg:col-span-5 card-fintech p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">What-If Prepayment Simulator</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Interest Accelerator
            </span>
          </div>

          {!selectedLoan ? (
            <p className="text-xs text-slate-400 py-6 text-center">Add or select a loan to simulate prepayment payoff impact.</p>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Target Loan for Simulation</label>
                  <select
                    value={activeSelectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none"
                  >
                    {loans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({formatCurrency(Number(l.outstanding_principal))})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between">
                    <label className="font-semibold text-slate-700">Extra Monthly Prepayment</label>
                    <strong className="text-teal-800 font-numeric">{formatCurrency(extraPrepayment)}</strong>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="1000"
                    value={extraPrepayment}
                    onChange={(e) => setExtraPrepayment(Number(e.target.value))}
                    className="mt-2 w-full accent-teal-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Prepayment ROI Impact Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
                  <span className="text-[11px] font-semibold text-emerald-800 block">Total Interest Saved</span>
                  <strong className="text-xl font-bold text-emerald-900 font-numeric mt-1 block">
                    {formatCurrency(prepayResult.interestSaved)}
                  </strong>
                  <span className="text-[10px] text-emerald-700 font-medium">Pure retained capital</span>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-center">
                  <span className="text-[11px] font-semibold text-teal-800 block">Time Slashed Off Loan</span>
                  <strong className="text-xl font-bold text-teal-950 font-numeric mt-1 block">
                    {prepayResult.monthsSaved} Mos ({(prepayResult.monthsSaved / 12).toFixed(1)} Yrs)
                  </strong>
                  <span className="text-[10px] text-teal-700 font-medium">Earlier debt freedom</span>
                </div>
              </div>

              {/* Payoff Curve */}
              {payoffData.length > 0 && (
                <div className="h-44 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payoffData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="regLoan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="accelLoan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `₹${v / 100000}L`} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="regular" name="Standard Schedule" stroke="#94A3B8" strokeWidth={2} fillOpacity={1} fill="url(#regLoan)" />
                      <Area type="monotone" dataKey="accelerated" name="Accelerated Schedule" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#accelLoan)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backend-Generated EMI Amortization Schedule Section */}
      <div className="card-fintech p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-900">
                Deterministic EMI Amortization Schedule
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Month-by-month principal and interest breakdown computed authoritatively by the FinSage backend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!scheduleData || !scheduleData.schedule || scheduleData.schedule.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-700 transition-colors disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchAmortization}
              disabled={isLoadingSchedule}
              className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              {isLoadingSchedule ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Calculator className="h-3.5 w-3.5" />
              )}
              <span>Calculate Schedule</span>
            </button>
          </div>
        </div>

        {/* Schedule Inputs Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
          <div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Loan Principal</span>
              <strong className="text-slate-900 font-numeric">{formatCurrency(calcPrincipal)}</strong>
            </div>
            <input
              type="range"
              min="100000"
              max="15000000"
              step="50000"
              value={calcPrincipal}
              onChange={(e) => setCalcPrincipal(Number(e.target.value))}
              className="mt-2 w-full accent-teal-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Interest Rate (p.a.)</span>
              <strong className="text-teal-700 font-numeric">{calcRate}%</strong>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              step="0.25"
              value={calcRate}
              onChange={(e) => setCalcRate(Number(e.target.value))}
              className="mt-2 w-full accent-teal-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Tenure</span>
              <strong className="text-slate-900 font-numeric">{calcTenureYears} Years ({calcTenureYears * 12} Mos)</strong>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={calcTenureYears}
              onChange={(e) => setCalcTenureYears(Number(e.target.value))}
              className="mt-2 w-full accent-teal-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Schedule Error Display */}
        {scheduleError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{scheduleError}</span>
          </div>
        )}

        {/* Schedule KPI Summary Bar */}
        {scheduleData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100 text-center">
              <span className="text-[10px] uppercase font-bold text-teal-800">Monthly EMI</span>
              <div className="text-lg font-black text-teal-950 font-numeric mt-0.5">
                {formatCurrency(Number(scheduleData.monthly_emi))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Principal</span>
              <div className="text-lg font-bold text-slate-900 font-numeric mt-0.5">
                {formatCurrency(Number(scheduleData.principal_amount))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-700">Total Interest</span>
              <div className="text-lg font-bold text-rose-700 font-numeric mt-0.5">
                {formatCurrency(Number(scheduleData.total_interest))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Repayment</span>
              <div className="text-lg font-bold text-slate-900 font-numeric mt-0.5">
                {formatCurrency(Number(scheduleData.total_payment))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Interactive Table */}
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <th className="py-3 px-3.5">Month</th>
                  <th className="py-3 px-3.5 text-right">Opening Balance</th>
                  <th className="py-3 px-3.5 text-right">Monthly EMI</th>
                  <th className="py-3 px-3.5 text-right text-teal-700">Principal Paid</th>
                  <th className="py-3 px-3.5 text-right text-rose-600">Interest Paid</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-numeric">
                {isLoadingSchedule ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-700 mb-1" />
                      Generating amortization schedule from backend...
                    </td>
                  </tr>
                ) : paginatedSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No schedule rows generated.
                    </td>
                  </tr>
                ) : (
                  paginatedSchedule.map((row) => (
                    <tr key={row.month_number} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-slate-700">
                        Month {row.month_number}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-600">
                        {formatCurrency(Number(row.opening_balance))}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900">
                        {formatCurrency(Number(row.emi))}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-teal-700">
                        {formatCurrency(Number(row.principal_component))}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-rose-600">
                        {formatCurrency(Number(row.interest_component))}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(Number(row.closing_balance))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          {scheduleData && totalSchedulePages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Showing months {(schedulePage - 1) * pageSize + 1} to{' '}
                {Math.min(scheduleData.schedule.length, schedulePage * pageSize)} of {scheduleData.schedule.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                  disabled={schedulePage === 1}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev Year</span>
                </button>

                <span className="font-bold text-slate-800">
                  Year {schedulePage} of {totalSchedulePages}
                </span>

                <button
                  onClick={() => setSchedulePage((p) => Math.min(totalSchedulePages, p + 1))}
                  disabled={schedulePage === totalSchedulePages}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                >
                  <span>Next Year</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Loan Modal */}
      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        loanToEdit={loanToEdit}
      />
    </div>
  );
};
