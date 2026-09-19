import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calculator,
  Target,
  ArrowRight,
  TrendingUp,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const GoalCalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  const [targetAmount, setTargetAmount] = useState<number>(1500000);
  const [currentSavings, setCurrentSavings] = useState<number>(200000);
  const [targetYears, setTargetYears] = useState<number>(5);
  const [expectedReturn, setExpectedReturn] = useState<number>(9.0);

  // Math formula for monthly SIP required to bridge the future value gap:
  // FV_existing = PV * (1 + r)^n
  // Shortfall = Target - FV_existing
  // Monthly_SIP = Shortfall * (r / ((1 + r)^n - 1))
  const calculation = useMemo(() => {
    const r = expectedReturn / (12 * 100);
    const n = targetYears * 12;
    const PV = currentSavings;
    const Target = targetAmount;

    const futureExisting = PV * Math.pow(1 + r, n);
    const shortfall = Math.max(0, Target - futureExisting);

    let monthlyRequired = 0;
    if (r === 0) {
      monthlyRequired = shortfall / n;
    } else {
      monthlyRequired = shortfall * (r / (Math.pow(1 + r, n) - 1));
    }

    const totalSelfInvestment = PV + Math.round(monthlyRequired) * n;
    const expectedInterest = Target - totalSelfInvestment;

    return {
      monthlyRequired: Math.round(monthlyRequired),
      futureExisting: Math.round(futureExisting),
      shortfall: Math.round(shortfall),
      totalSelfInvestment: Math.round(totalSelfInvestment),
      expectedInterest: Math.max(0, Math.round(expectedInterest)),
    };
  }, [targetAmount, currentSavings, targetYears, expectedReturn]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <Target className="h-3.5 w-3.5 text-teal-600" />
            <span>Goal Target Planner</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Financial Goal Calculator
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Determine exactly how much you need to save and invest every month to achieve your car, home, education, or emergency goals on time.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sliders */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-700" />
              <span>Goal Objective</span>
            </h2>

            {/* Target Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Target Goal Amount</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span>₹</span>
                  <input
                    type="number"
                    min="10000"
                    max="50000000"
                    step="50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Math.max(10000, Number(e.target.value)))}
                    className="w-24 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <input
                type="range"
                min="50000"
                max="10000000"
                step="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Current Savings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Already Saved</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    max={targetAmount}
                    step="10000"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(Math.max(0, Number(e.target.value)))}
                    className="w-24 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(500000, targetAmount)}
                step="10000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Target Timeline (Years)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={targetYears}
                    onChange={(e) => setTargetYears(Math.max(1, Number(e.target.value)))}
                    className="w-12 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                  <span>Yrs</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={targetYears}
                onChange={(e) => setTargetYears(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Expected Return */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Expected Annual Growth (% p.a.)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Math.max(0.1, Number(e.target.value)))}
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
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-teal-600/30 bg-white p-6 sm:p-8 shadow-md space-y-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Required Monthly Savings
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-900 mt-1">
                ₹{calculation.monthlyRequired.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Every month for {targetYears * 12} months
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Goal Target</span>
                <span className="font-bold text-slate-900">₹{targetAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Existing Savings Growth</span>
                <span className="font-bold text-slate-700">₹{calculation.futureExisting.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Total Capital Contributed</span>
                <span className="font-bold text-slate-800">₹{calculation.totalSelfInvestment.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2">
                <span className="text-slate-500">Compounded Growth Boost</span>
                <span className="font-bold text-emerald-700">+₹{calculation.expectedInterest.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/goals')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                <span>Track Goal in FinSage</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
