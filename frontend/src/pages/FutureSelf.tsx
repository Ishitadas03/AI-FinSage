import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Sliders,
  DollarSign,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Calendar,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatCompactNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export const FutureSelf: React.FC = () => {
  const { netWorth } = useFinance();

  // Dynamic simulation inputs
  const [currentSavings, setCurrentSavings] = useState(netWorth || 1240000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(25000);
  const [expectedReturn, setExpectedReturn] = useState(12); // in %
  const [incomeGrowth, setIncomeGrowth] = useState(8); // in %
  const [inflationRate, setInflationRate] = useState(6); // in %
  const [projectionYears, setProjectionYears] = useState(20);
  const [scenario, setScenario] = useState<'conservative' | 'realistic' | 'optimistic'>('realistic');

  // Quick Scenario preset applicator
  const applyScenario = (type: 'conservative' | 'realistic' | 'optimistic') => {
    setScenario(type);
    if (type === 'conservative') {
      setExpectedReturn(8);
      setIncomeGrowth(5);
      setInflationRate(7);
    } else if (type === 'realistic') {
      setExpectedReturn(12);
      setIncomeGrowth(8);
      setInflationRate(6);
    } else {
      setExpectedReturn(15);
      setIncomeGrowth(10);
      setInflationRate(5);
    }
  };

  // Compute Year-by-Year Simulation
  const { projectionData, finalNominal, finalReal, totalInvested } = useMemo(() => {
    const data = [];
    let currentCorpus = currentSavings;
    let currentMonthlySip = monthlyInvestment;
    let cumulativeInvested = currentSavings;
    const startYear = 2026;

    data.push({
      year: startYear,
      age: 28,
      nominalWealth: Math.round(currentCorpus),
      realWealth: Math.round(currentCorpus),
      investedCapital: Math.round(cumulativeInvested),
      annualInterest: 0,
    });

    for (let yr = 1; yr <= projectionYears; yr++) {
      let annualContribution = 0;
      // Monthly compounding calculation
      for (let m = 0; m < 12; m++) {
        currentCorpus = (currentCorpus + currentMonthlySip) * (1 + (expectedReturn / 100) / 12);
        cumulativeInvested += currentMonthlySip;
        annualContribution += currentMonthlySip;
      }

      // Step up monthly SIP annually by income growth %
      currentMonthlySip = currentMonthlySip * (1 + incomeGrowth / 100);

      // Inflation-adjusted real value
      const inflationFactor = Math.pow(1 + inflationRate / 100, yr);
      const realWealth = currentCorpus / inflationFactor;

      data.push({
        year: startYear + yr,
        age: 28 + yr,
        nominalWealth: Math.round(currentCorpus),
        realWealth: Math.round(realWealth),
        investedCapital: Math.round(cumulativeInvested),
        annualInterest: Math.round(currentCorpus - cumulativeInvested),
      });
    }

    const last = data[data.length - 1];
    return {
      projectionData: data,
      finalNominal: last.nominalWealth,
      finalReal: last.realWealth,
      totalInvested: last.investedCapital,
    };
  }, [currentSavings, monthlyInvestment, expectedReturn, incomeGrowth, inflationRate, projectionYears]);

  const wealthMultiplier = (finalNominal / (totalInvested || 1)).toFixed(1);
  const passiveMonthlyIncome = Math.round((finalNominal * 0.08) / 12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-teal-700" />
            Future Self Wealth Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Model compounding trajectories, inflation impacts, and life milestone timestamps.
          </p>
        </div>

        {/* Preset scenario tabs */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit">
          {(['conservative', 'realistic', 'optimistic'] as const).map((s) => (
            <button
              key={s}
              onClick={() => applyScenario(s)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-all",
                scenario === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white">
          <span className="text-xs font-medium text-teal-200">Future Net Worth ({2026 + projectionYears})</span>
          <div className="mt-2 text-2xl font-black font-numeric tracking-tight text-white">
            {formatCompactNumber(finalNominal)}
          </div>
          <p className="text-[11px] text-teal-300 font-semibold mt-1">
            Real Value: {formatCompactNumber(finalReal)} (in today's money)
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Capital Invested</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCompactNumber(totalInvested)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Principal contributions</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Compounding Multiplier</span>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-numeric">
            {wealthMultiplier}x Growth
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            ₹{formatCompactNumber(finalNominal - totalInvested)} generated in interest
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Est. Monthly Passive Inflow</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {formatCurrency(passiveMonthlyIncome)} / mo
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Based on safe 8% SWP drawdown</p>
        </div>
      </div>

      {/* Main Simulation Layout: Left Controls (4 cols), Right Charts & Milestones (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Slider Controls */}
        <div className="lg:col-span-4 card-fintech p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="h-4 w-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Simulation Variables</h3>
          </div>

          {/* Current Savings */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Initial Corpus</span>
              <strong className="text-slate-900 font-numeric">{formatCurrency(currentSavings)}</strong>
            </div>
            <input
              type="range"
              min="100000"
              max="5000000"
              step="50000"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          {/* Monthly SIP */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Monthly Investment (SIP)</span>
              <strong className="text-slate-900 font-numeric">{formatCurrency(monthlyInvestment)}/mo</strong>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="2500"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          {/* Expected Return Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Expected Annual Return</span>
              <strong className="text-teal-700 font-numeric">{expectedReturn}% CAGR</strong>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          {/* Income / Step-up Growth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Annual SIP Step-Up</span>
              <strong className="text-slate-900 font-numeric">{incomeGrowth}% / yr</strong>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={incomeGrowth}
              onChange={(e) => setIncomeGrowth(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          {/* Inflation Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Expected Inflation</span>
              <strong className="text-rose-600 font-numeric">{inflationRate}%</strong>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="0.5"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          {/* Projection Horizon */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Time Horizon</span>
              <strong className="text-teal-900 font-bold">{projectionYears} Years (Age {28 + projectionYears})</strong>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[10, 15, 20, 25, 30].map((yrs) => (
                <button
                  key={yrs}
                  onClick={() => setProjectionYears(yrs)}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-bold transition-all",
                    projectionYears === yrs
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {yrs}y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Charts & Milestones */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Area Chart */}
          <div className="card-fintech p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Compound Wealth Projection</h3>
                <p className="text-xs text-slate-400">Total Nominal Wealth vs Inflation-Adjusted Purchasing Power</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-teal-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Nominal Corpus
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Real Value
                </span>
              </div>
            </div>

            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="futureNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="futureReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      formatCurrency(v),
                      name === 'nominalWealth' ? 'Nominal Value' : 'Real Value (Adjusted)',
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="nominalWealth"
                    stroke="#0F766E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#futureNominal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="realWealth"
                    stroke="#64748B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#futureReal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Milestones Timeline */}
          <div className="card-fintech p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-700" />
              Financial Freedom Milestones
            </h3>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: '₹25 Lakhs', desc: 'Emergency Foundation', year: 2028, age: 30, icon: ShieldCheck },
                { title: '₹50 Lakhs', desc: 'Down Payment Ready', year: 2031, age: 33, icon: TrendingUp },
                { title: '₹1 Crore', desc: 'Crorepati Milestone', year: 2035, age: 37, icon: Sparkles },
                { title: '₹2.5 Crores', desc: 'Full Financial Freedom', year: 2041, age: 43, icon: Award },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.title} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-center space-y-1">
                    <Icon className="h-5 w-5 text-teal-700 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-900 font-numeric">{m.title}</h4>
                    <p className="text-[10px] text-slate-500">{m.desc}</p>
                    <span className="inline-block text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full mt-1">
                      {m.year} (Age {m.age})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Action Suggestions */}
          <div className="card-fintech p-5 bg-teal-50/40 border-teal-200">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-teal-950">AI Optimization Leverage</h4>
                <p className="text-teal-900 leading-relaxed">
                  Stepping up your monthly SIP by just <strong>₹3,000/month</strong> today enables you to reach the <strong>₹1 Crore Crorepati milestone 2.4 years sooner</strong> (in 2033 instead of 2035) and adds ₹42 Lakhs to your net worth at age 48!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
