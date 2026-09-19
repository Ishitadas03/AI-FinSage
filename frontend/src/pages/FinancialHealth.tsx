import React from 'react';
import {
  Activity,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';

export const FinancialHealth: React.FC = () => {
  const { financialHealth, setIsChatOpen } = useFinance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-700" />
            Financial Health Diagnostic & Benchmark
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic multi-dimensional health audit benchmarked against top percentile wealth builders.
          </p>
        </div>

        <button
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors w-fit"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Ask AI How to Reach 85+ Score</span>
        </button>
      </div>

      {/* Main Score Hero Card */}
      <div className="card-fintech p-6 bg-gradient-to-r from-white via-teal-50/20 to-white">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          {/* Circular Gauge */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-600"
                  strokeDasharray="72, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 font-numeric">72</span>
                <span className="text-[10px] font-semibold text-slate-400 -mt-1">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-teal-900">Good Progress</h3>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                  Top 24th Percentile
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                {financialHealth.summary}
              </p>
            </div>
          </div>

          {/* Historical Trend Chart */}
          <div className="w-full md:w-64 h-24">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
              6-Month Trend (+14 pts)
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialHealth.history}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[50, 80]} hide />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="score" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 3, fill: '#0F766E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5 Pillars Deep Dive */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">5 Pillar Diagnostic Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {financialHealth.pillars.map((p) => {
            const isExcellent = p.score >= 80;
            const isGood = p.score >= 70 && p.score < 80;
            const isFair = p.score >= 60 && p.score < 70;

            return (
              <div key={p.name} className="card-fintech p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isExcellent ? "bg-emerald-50 text-emerald-700" :
                        isGood ? "bg-teal-50 text-teal-800" :
                        isFair ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      )}
                    >
                      {p.score}/100 • {p.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isExcellent ? "bg-emerald-600" :
                          isGood ? "bg-teal-600" :
                          isFair ? "bg-amber-500" :
                          "bg-rose-500"
                        )}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <strong className="text-slate-800 font-semibold">{p.metric}</strong>
                      <span className="text-slate-400">{p.benchmark}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column: Improvement Action Items (7 cols) + Recognized Strengths (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Action Items */}
        <div className="lg:col-span-7 card-fintech p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-700" />
            Top High-Impact Improvement Opportunities
          </h3>

          <div className="space-y-3">
            {financialHealth.improvementAreas.map((area, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{area.title}</h4>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                    {area.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{area.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recognized Strengths */}
        <div className="lg:col-span-5 card-fintech p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" />
            Recognized Financial Strengths
          </h3>

          <div className="space-y-2.5">
            {financialHealth.positiveHabits.map((habit, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{habit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
