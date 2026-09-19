import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Percent,
  Calculator,
  ShieldCheck,
  Zap,
  TrendingDown,
  Building,
  Car,
  Clock,
  ArrowRight,
  Sparkles,
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
import { cn } from '@/lib/utils';

export const DebtEMI: React.FC = () => {
  const { loans, totalDebt, totalMonthlyEmi, emiToIncomeRatio, simulatePrepayment } = useFinance();

  // EMI Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState(2000000);
  const [calcRate, setCalcRate] = useState(8.75);
  const [calcTenureYears, setCalcTenureYears] = useState(15);

  // What-if Prepayment Simulator State
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || 'l-1');
  const [extraPrepayment, setExtraPrepayment] = useState(5000);

  // Calculated EMI for the standalone calculator
  const calculatorResult = useMemo(() => {
    return calculateEMI(calcPrincipal, calcRate, calcTenureYears * 12);
  }, [calcPrincipal, calcRate, calcTenureYears]);

  // Prepayment simulation result
  const prepayResult = useMemo(() => {
    return simulatePrepayment(selectedLoanId, extraPrepayment);
  }, [selectedLoanId, extraPrepayment, simulatePrepayment]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId) || loans[0];

  // Payoff chart comparison data
  const payoffData = useMemo(() => {
    const data = [];
    const months = selectedLoan.remainingTenureMonths;
    const newMonths = prepayResult.newTenureMonths;
    const initialPrincipal = selectedLoan.principalRemaining;

    for (let yr = 0; yr <= Math.ceil(months / 12); yr++) {
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

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>EMI-to-Income: {emiToIncomeRatio}% (Healthy &lt;35%)</span>
          </div>
        </div>
      </div>

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
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Well within safe bank bounds</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Credit Card Revolving Debt</span>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-numeric">
            ₹0 (Paid in Full)
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">0% high-interest penalty</p>
        </div>
      </div>

      {/* Active Loan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loans.map((loan) => {
          const Icon = loan.loanType === 'Home Loan' ? Building : Car;
          return (
            <div key={loan.id} className="card-fintech p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-sm border border-teal-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{loan.name}</h3>
                    <p className="text-[11px] text-slate-500">{loan.lender} • {loan.accountNumber}</p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {loan.interestRate}% ROI
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Balance</span>
                  <strong className="text-slate-900 font-numeric">{formatCurrency(loan.principalRemaining)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Monthly EMI</span>
                  <strong className="text-teal-800 font-numeric">{formatCurrency(loan.monthlyEmi)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tenure Left</span>
                  <strong className="text-slate-900 font-numeric">{loan.remainingTenureMonths} Mos</strong>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Repaid: {formatCurrency(loan.originalAmount - loan.principalRemaining)}</span>
                  <span>Original: {formatCurrency(loan.originalAmount)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{
                      width: `${Math.round(((loan.originalAmount - loan.principalRemaining) / loan.originalAmount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Target Loan to Accelerate</label>
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                {loans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({formatCurrency(l.principalRemaining)})
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
                {prepayResult.monthsSaved} Months ({ (prepayResult.monthsSaved / 12).toFixed(1) } Yrs)
              </strong>
              <span className="text-[10px] text-teal-700 font-medium">Debt-free much earlier</span>
            </div>
          </div>

          {/* Payoff Curve */}
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
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `₹${v/100000}L`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="regular" name="Standard Schedule" stroke="#94A3B8" strokeWidth={2} fillOpacity={1} fill="url(#regLoan)" />
                <Area type="monotone" dataKey="accelerated" name="Accelerated Schedule" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#accelLoan)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
    </div>
  );
};
