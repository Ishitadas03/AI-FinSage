import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calculator,
  PiggyBank,
  ArrowRight,
  TrendingUp,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const SavingsCalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  const [initialDeposit, setInitialDeposit] = useState<number>(50000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [annualRate, setAnnualRate] = useState<number>(8.0);
  const [years, setYears] = useState<number>(10);

  // Future value calculation with compounding monthly deposits
  const calculation = useMemo(() => {
    const r = annualRate / (12 * 100);
    const n = years * 12;
    const P = initialDeposit;
    const PMT = monthlyContribution;

    let fv = 0;
    if (r === 0) {
      fv = P + PMT * n;
    } else {
      fv = P * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r);
    }

    const totalDeposited = P + PMT * n;
    const totalInterest = fv - totalDeposited;
    const gainRatio = totalDeposited > 0 ? Math.round((totalInterest / fv) * 100) : 0;

    return {
      futureValue: Math.round(fv),
      totalDeposited: Math.round(totalDeposited),
      totalInterest: Math.round(totalInterest),
      gainRatio,
    };
  }, [initialDeposit, monthlyContribution, annualRate, years]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <PiggyBank className="h-3.5 w-3.5 text-teal-600" />
            <span>Savings & Compounding</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Savings Growth Calculator
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Visualize how regular monthly savings combined with compounded returns build significant long-term wealth.
          </p>
        </div>
      </section>

      {/* Main Calculator */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sliders */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              <span>Investment Inputs</span>
            </h2>

            {/* Input 1: Initial Deposit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Initial Deposit</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    step="5000"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(Math.max(0, Number(e.target.value)))}
                    className="w-24 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="2000000"
                step="10000"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Input 2: Monthly Contribution */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Monthly Contribution</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span>₹</span>
                  <input
                    type="number"
                    min="500"
                    max="500000"
                    step="500"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                    className="w-20 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Input 3: Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Expected Return (% p.a.)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="25"
                    step="0.5"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(Math.max(0.1, Number(e.target.value)))}
                    className="w-14 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="18"
                step="0.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Input 4: Time Horizon */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Time Horizon (Years)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={years}
                    onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                    className="w-12 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                  <span>Yrs</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-teal-600/30 bg-white p-6 sm:p-8 shadow-md space-y-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Projected Total Corpus
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-900 mt-1">
                ₹{calculation.futureValue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">After {years} years of compounding</div>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-teal-800">Your Deposits ({100 - calculation.gainRatio}%)</span>
                <span className="text-emerald-600">Wealth Gain ({calculation.gainRatio}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-emerald-500 overflow-hidden flex">
                <div
                  className="bg-teal-700 h-full"
                  style={{ width: `${100 - calculation.gainRatio}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Total Amount Invested</span>
                <span className="font-bold text-slate-900">₹{calculation.totalDeposited.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Total Interest Earned</span>
                <span className="font-bold text-emerald-700">+₹{calculation.totalInterest.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/goals')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                <span>Save as Financial Goal</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
