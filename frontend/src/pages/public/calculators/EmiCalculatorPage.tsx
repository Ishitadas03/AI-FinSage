import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calculator,
  Landmark,
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';

export const EmiCalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  const [loanAmount, setLoanAmount] = useState<number>(2500000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(15);

  // Mathematical calculation: E = P * r * (1+r)^n / ((1+r)^n - 1)
  const calculation = useMemo(() => {
    const P = loanAmount;
    const monthlyRate = interestRate / (12 * 100);
    const n = tenureYears * 12;

    if (monthlyRate === 0 || n === 0) {
      const emi = P / (n || 1);
      return {
        emi: Math.round(emi),
        totalRepayment: P,
        totalInterest: 0,
        interestRatio: 0,
      };
    }

    const emi = (P * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const totalRepayment = emi * n;
    const totalInterest = totalRepayment - P;
    const interestRatio = Math.round((totalInterest / totalRepayment) * 100);

    return {
      emi: Math.round(emi),
      totalRepayment: Math.round(totalRepayment),
      totalInterest: Math.round(totalInterest),
      interestRatio,
    };
  }, [loanAmount, interestRate, tenureYears]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <Calculator className="h-3.5 w-3.5 text-teal-600" />
            <span>Financial Planning Tools</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            EMI Calculator
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Calculate your exact monthly installments, total interest cost, and evaluate early prepayment impact on your loans.
          </p>
        </div>
      </section>

      {/* Main Calculator Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Input Sliders */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-teal-700" />
              <span>Loan Parameters</span>
            </h2>

            {/* Input 1: Loan Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Loan Amount</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span>₹</span>
                  <input
                    type="number"
                    min="10000"
                    max="50000000"
                    step="50000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Math.max(10000, Number(e.target.value)))}
                    className="w-24 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <input
                type="range"
                min="50000"
                max="20000000"
                step="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹50,000</span>
                <span>₹1 Crore</span>
                <span>₹2 Crore</span>
              </div>
            </div>

            {/* Input 2: Interest Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Interest Rate (% p.a.)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Math.max(0.1, Number(e.target.value)))}
                    className="w-14 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="0.25"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>4%</span>
                <span>12%</span>
                <span>24%</span>
              </div>
            </div>

            {/* Input 3: Tenure */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Loan Tenure (Years)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Math.max(1, Number(e.target.value)))}
                    className="w-12 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                  <span>Yrs</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 Year</span>
                <span>15 Years</span>
                <span>30 Years</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600">
              <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                Standard reducing balance formula applied. Monthly reducing loans incur less aggregate interest than flat rate products.
              </span>
            </div>
          </div>

          {/* Right: Calculated Summary Card */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-teal-600/30 bg-white p-6 sm:p-8 shadow-md space-y-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Monthly Repayment
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-900 mt-1">
                ₹{calculation.emi.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Per month for {tenureYears * 12} installments</div>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-teal-700">Principal ({100 - calculation.interestRatio}%)</span>
                <span className="text-amber-700">Interest ({calculation.interestRatio}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-amber-500 overflow-hidden flex">
                <div
                  className="bg-teal-700 h-full"
                  style={{ width: `${100 - calculation.interestRatio}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Principal Amount</span>
                <span className="font-bold text-slate-900">₹{loanAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Total Interest Payable</span>
                <span className="font-bold text-amber-700">₹{calculation.totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2">
                <span className="font-bold text-slate-800">Total Amount Payable</span>
                <span className="font-extrabold text-slate-900 text-sm">₹{calculation.totalRepayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/debt-emi')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                <span>Track Loan in FinSage</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Related Resources */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Need guidance on reducing interest?</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Read our comprehensive guide on prepayment strategies and fixed vs floating loans.
            </p>
          </div>
          <Link
            to="/resources/emi-guide"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 shrink-0"
          >
            <span>Read EMI Guide</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
