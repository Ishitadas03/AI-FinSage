import React, { useState, useMemo } from 'react';
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
  } = useFinance();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<ApiLoan | null>(null);

  // EMI Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState(2000000);
  const [calcRate, setCalcRate] = useState(8.75);
  const [calcTenureYears, setCalcTenureYears] = useState(15);

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
            Accelerate debt freedom, simulate principal prepayments, and analyze EMI stress metrics.
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
          <p className="text-[11px] text-slate-400 mt-1">Across {loans.length} active loans</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Monthly EMI Inflow</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalMonthlyEmi)} / mo
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Automated bank ECS debits</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Debt-to-Income Ratio</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {emiToIncomeRatio}%
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {emiToIncomeRatio <= 35 ? 'Well within safe bank bounds' : 'High debt strain'}
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Debt Stress Rating</span>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-numeric capitalize">
            {debtStress?.stress_level || 'Healthy'}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {debtStress ? `Score: ${debtStress.overall_stress_score}/100` : '0% high-interest penalty'}
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingLoans && loans.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="card-fintech p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingLoans && loans.length === 0 && (
        <div className="card-fintech p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No active loans found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You currently have no loan records saved in FinSage. Add your home, auto, or personal loans to track monthly EMIs, balance schedules, and simulate prepayment savings.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Loan</span>
          </button>
        </div>
      )}

      {/* Active Loan Cards */}
      {loans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loans.map((loan) => {
            const principal = Number(loan.principal_amount || 0);
            const outstanding = Number(loan.outstanding_principal || 0);
            const repaid = Math.max(0, principal - outstanding);
            const repaidPercent = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;

            const isHome = loan.name.toLowerCase().includes('home');
            const Icon = isHome ? Building : Car;

            return (
              <div key={loan.id} className="card-fintech p-5 space-y-4 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-sm border border-teal-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{loan.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        Started: {new Date(loan.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {loan.interest_rate}% ROI
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(loan)}
                      className="p-1 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit Loan"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLoan(loan.id, loan.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Delete Loan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Balance</span>
                    <strong className="text-slate-900 font-numeric">{formatCurrency(outstanding)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monthly EMI</span>
                    <strong className="text-teal-800 font-numeric">{formatCurrency(loan.monthly_emi)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tenure Left</span>
                    <strong className="text-slate-900 font-numeric">{loan.tenure_months} Mos</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Repaid: {formatCurrency(repaid)} ({repaidPercent}%)</span>
                    <span>Original: {formatCurrency(principal)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-300"
                      style={{ width: `${repaidPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2-Column: What-If Prepayment Simulator (7 cols) + Standalone EMI Calculator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prepayment Simulator */}
        <div className="lg:col-span-7 card-fintech p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">What-If Extra Prepayment Accelerator</h3>
            </div>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
              High Impact
            </span>
          </div>

          {loans.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Add a loan above to simulate how extra monthly prepayments reduce interest and slash loan tenure.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Loan to Accelerate</label>
                  <select
                    value={activeSelectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {loans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({formatCurrency(l.outstanding_principal)})
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
                  <span className="text-[10px] text-emerald-700 font-medium">Pure money retained in pocket</span>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-center">
                  <span className="text-[11px] font-semibold text-teal-800 block">Time Slashed Off Loan</span>
                  <strong className="text-xl font-bold text-teal-950 font-numeric mt-1 block">
                    {prepayResult.monthsSaved} Months ({(prepayResult.monthsSaved / 12).toFixed(1)} Yrs)
                  </strong>
                  <span className="text-[10px] text-teal-700 font-medium">Debt-free much earlier</span>
                </div>
              </div>

              {/* Payoff Curve */}
              {payoffData.length > 0 && (
                <div className="h-52 pt-2">
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
            </>
          )}
        </div>

        {/* Standalone EMI Calculator */}
        <div className="lg:col-span-5 card-fintech p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="h-5 w-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">New Loan EMI Calculator</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Loan Amount</span>
                <strong className="text-slate-900 font-numeric">{formatCurrency(calcPrincipal)}</strong>
              </div>
              <input
                type="range"
                min="100000"
                max="10000000"
                step="50000"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                className="mt-1.5 w-full accent-teal-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Interest Rate (p.a.)</span>
                <strong className="text-teal-700 font-numeric">{calcRate}%</strong>
              </div>
              <input
                type="range"
                min="5"
                max="18"
                step="0.25"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                className="mt-1.5 w-full accent-teal-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tenure (Years)</span>
                <strong className="text-slate-900 font-numeric">{calcTenureYears} Years ({calcTenureYears * 12} Mos)</strong>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={calcTenureYears}
                onChange={(e) => setCalcTenureYears(Number(e.target.value))}
                className="mt-1.5 w-full accent-teal-700 cursor-pointer"
              />
            </div>

            {/* Calculated Output Card */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2.5">
              <div className="text-center pb-2 border-b border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Monthly EMI Due</span>
                <div className="text-2xl font-black text-teal-900 font-numeric mt-0.5">
                  {formatCurrency(calculatorResult.monthlyEmi)}
                </div>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Principal Amount:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(calcPrincipal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Total Interest Payable:</span>
                <span className="font-semibold text-rose-600">{formatCurrency(calculatorResult.totalInterest)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Amount Payable:</span>
                <strong className="font-bold text-slate-900">{formatCurrency(calculatorResult.totalPayment)}</strong>
              </div>
            </div>
          </div>
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
