import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calculator,
  Zap,
  ArrowRight,
  TrendingUp,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CompoundInterestPage: React.FC = () => {
  const navigate = useNavigate();

  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(10.0);
  const [years, setYears] = useState<number>(8);
  const [frequency, setFrequency] = useState<number>(12); // 12 = monthly, 4 = quarterly, 1 = annually

  const calculation = useMemo(() => {
    const P = principal;
    const r = rate / 100;
    const n = frequency;
    const t = years;

    const A = P * Math.pow(1 + r / n, n * t);
    const totalInterest = A - P;
    const doublingYears = rate > 0 ? (72 / rate).toFixed(1) : '∞';

    return {
      futureValue: Math.round(A),
      totalPrincipal: P,
      totalInterest: Math.round(totalInterest),
      doublingYears,
      multiplier: (A / (P || 1)).toFixed(2),
    };
  }, [principal, rate, years, frequency]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <Zap className="h-3.5 w-3.5 text-teal-600" />
            <span>Wealth Multiplier Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Compound Interest Calculator
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Discover the exponential growth power of compound interest and estimate your portfolio doubling velocity.
          </p>
        </div>
      </section>

      {/* Main Calculator */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sliders & Selectors */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              <span>Compounding Variables</span>
            </h2>

            {/* Principal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Initial Principal Amount</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span>₹</span>
                  <input
                    type="number"
                    min="1000"
                    max="50000000"
                    step="5000"
                    value={principal}
                    onChange={(e) => setPrincipal(Math.max(1000, Number(e.target.value)))}
                    className="w-24 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                </div>
              </div>
              <input
                type="range"
                min="5000"
                max="5000000"
                step="10000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Annual Interest Rate (% p.a.)</label>
                <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    value={rate}
                    onChange={(e) => setRate(Math.max(0.1, Number(e.target.value)))}
                    className="w-14 bg-transparent text-right font-bold text-teal-900 focus:outline-hidden"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">Duration (Years)</label>
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
                max="30"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Frequency Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Compounding Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency(12)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    frequency === 12
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency(4)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    frequency === 4
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency(1)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    frequency === 1
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Annually
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-teal-600/30 bg-white p-6 sm:p-8 shadow-md space-y-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Maturity Amount
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-900 mt-1">
                ₹{calculation.futureValue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                {calculation.multiplier}x Initial Investment
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Initial Principal</span>
                <span className="font-bold text-slate-900">₹{calculation.totalPrincipal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Compound Gain</span>
                <span className="font-bold text-emerald-700">+₹{calculation.totalInterest.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Rule of 72 card */}
            <div className="rounded-xl bg-teal-50 p-3.5 border border-teal-100 text-xs text-teal-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-teal-700" />
                <span>Rule of 72 Doubling Time</span>
              </div>
              <p className="text-[11px] text-teal-800">
                At {rate}% annual interest, your capital will roughly double every <strong>{calculation.doublingYears} years</strong>.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/future-self')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                <span>Run Future Self Simulation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
