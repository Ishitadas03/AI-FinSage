import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart as PieIcon,
  Wallet,
  Target,
  ShieldCheck,
  Search,
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

export const HeroDashboardPreview: React.FC = () => {
  const cashFlowMiniData = [
    { month: 'Apr', inc: 82, exp: 51 },
    { month: 'May', inc: 82, exp: 54 },
    { month: 'Jun', inc: 85, exp: 58 },
    { month: 'Jul', inc: 85, exp: 52 },
    { month: 'Aug', inc: 98, exp: 56 },
    { month: 'Sep', inc: 85, exp: 54 },
  ];

  return (
    <div className="relative mx-auto w-full select-none">
      {/* Subtle Ambient Mint/Teal Glow behind the floating card */}
      <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-teal-500/15 via-emerald-400/10 to-teal-600/15 blur-2xl opacity-70 pointer-events-none" />

      {/* Main Elevated Dashboard Container */}
      <div className="relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(15,23,42,0.12)]">
        
        {/* Left Mini Sidebar (Matching Reference Preview) */}
        <div className="hidden lg:flex w-14 flex-col items-center justify-between border-r border-slate-100 bg-slate-50/50 py-4 shrink-0">
          <div className="space-y-4 flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100/70 text-teal-800">
              <Leaf className="h-4 w-4 transform -rotate-12" />
            </div>

            <div className="space-y-2 pt-2 flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold shadow-xs">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600">
                <Target className="h-4 w-4" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="h-6 w-6 rounded-full bg-teal-800 text-[9px] font-bold text-white flex items-center justify-center">
            RS
          </div>
        </div>

        {/* Main Dashboard Canvas */}
        <div className="flex-1 p-3.5 sm:p-5 bg-slate-50/30 space-y-3.5">
          {/* Dashboard Mini Topbar */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Good morning, Rahul ☀️
              </h4>
              <p className="text-[10px] text-slate-400">A little progress each day goes a long way.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-400 shadow-2xs">
                <Search className="h-3 w-3 text-slate-400" />
                <span>Search...</span>
                <kbd className="rounded bg-slate-100 px-1 py-0.2 text-[8px] font-semibold text-slate-400">Ctrl K</kbd>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-2xs">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Sep 2026</span>
                <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
              </div>

              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[9px] font-bold text-white">
                RS
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Net Worth */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Net Worth</span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-numeric mt-0.5">
                ₹12,40,000
              </div>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5" /> +8.2%
              </span>
            </div>

            {/* Income */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Monthly Income</span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-numeric mt-0.5">
                ₹85,000
              </div>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5" /> +3.1%
              </span>
            </div>

            {/* Expenses */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Monthly Expenses</span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 font-numeric mt-0.5">
                ₹54,200
              </div>
              <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5 mt-0.5">
                <TrendingDown className="h-2.5 w-2.5" /> -4.5%
              </span>
            </div>

            {/* Savings Rate */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <span className="text-[9px] font-semibold text-slate-400 block">Savings Rate</span>
              <div className="text-xs sm:text-sm font-bold text-teal-800 font-numeric mt-0.5">
                28%
              </div>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5" /> +2.4%
              </span>
            </div>
          </div>

          {/* Middle Row: Financial Health + Cash Flow Bar Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Financial Health Mini Card */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-800">Financial Health</span>
                <span className="text-[9px] font-semibold text-teal-700">Good Progress</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Mini Circle Gauge */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-teal-600"
                      strokeDasharray="72, 100"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-black text-slate-900">72</span>
                    <span className="text-[7px] text-slate-400 block -mt-0.5">/100</span>
                  </div>
                </div>

                {/* Sub Bars */}
                <div className="flex-1 space-y-1 text-[9px]">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Savings Discipline</span>
                    <span className="font-bold text-slate-800">78</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full w-[78%]" />
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium pt-0.5">
                    <span>Emergency Readiness</span>
                    <span className="font-bold text-amber-600">54</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[54%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Mini Chart Card */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-800">Cash Flow (6 Mos)</span>
                <div className="flex items-center gap-1.5 text-[8px] font-medium text-slate-400">
                  <span className="flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> In
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-800" /> Out
                  </span>
                </div>
              </div>

              <div className="h-20 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowMiniData} margin={{ top: 2, right: 0, left: -25, bottom: -5 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 8, fill: '#94A3B8' }} />
                    <Bar dataKey="inc" fill="#0D9488" radius={[2, 2, 0, 0]} maxBarSize={6} />
                    <Bar dataKey="exp" fill="#1E293B" radius={[2, 2, 0, 0]} maxBarSize={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Insights Strip */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-teal-600" /> AI Insights
              </span>
              <span className="text-[9px] text-teal-700 font-semibold">View all →</span>
            </div>

            <div className="flex items-start gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0" />
              <span>
                <strong>Dining Spike:</strong> Food & dining is 18% above your monthly average.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
