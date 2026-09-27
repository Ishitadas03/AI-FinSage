import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ShieldCheck,
  Plus,
  Target,
  Upload,
  MessageSquare,
  AlertCircle,
  Car,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const DONUT_COLORS = ['#3B82F6', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#1E293B', '#EC4899', '#64748B'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    financialHealth,
    analyticsOverview,
    financialHealthOverview,
    goals,
    insights,
    setIsAddTransactionOpen,
    setIsAddGoalOpen,
    setIsImportModalOpen,
    setIsChatOpen,
  } = useFinance();

  // Dynamic Cash flow data from live analytics
  const cashFlowData = useMemo(() => {
    if (analyticsOverview?.trend && analyticsOverview.trend.length > 0) {
      return analyticsOverview.trend.map((t) => {
        const monthLabel = t.period.length === 10
          ? new Date(t.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : t.period.length === 7
          ? new Date(`${t.period}-01`).toLocaleDateString('en-US', { month: 'short' })
          : t.period;
        return {
          month: monthLabel,
          income: Number(t.income || 0),
          expenses: Number(t.expenses || 0),
        };
      });
    }
    return [
      { month: 'Apr', income: 82000, expenses: 51000 },
      { month: 'May', income: 82000, expenses: 53500 },
      { month: 'Jun', income: 85000, expenses: 58000 },
      { month: 'Jul', income: 85000, expenses: 52000 },
      { month: 'Aug', income: 98000, expenses: 56000 },
      { month: 'Sep', income: 85000, expenses: 54200 },
    ];
  }, [analyticsOverview]);

  // Dynamic Where Your Money Goes donut data from live analytics
  const spendingData = useMemo(() => {
    if (analyticsOverview?.spending_by_category && analyticsOverview.spending_by_category.length > 0) {
      return analyticsOverview.spending_by_category.map((cat, idx) => ({
        name: cat.category,
        value: Number(cat.amount),
        percentage: `${Number(cat.percentage).toFixed(0)}%`,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }));
    }
    return [
      { name: 'Housing', value: 18000, percentage: '33%', color: '#3B82F6' },
      { name: 'Food', value: 9200, percentage: '17%', color: '#10B981' },
      { name: 'Transport', value: 5400, percentage: '10%', color: '#06B6D4' },
      { name: 'Shopping', value: 4800, percentage: '9%', color: '#F59E0B' },
      { name: 'Subscriptions', value: 2100, percentage: '4%', color: '#8B5CF6' },
      { name: 'Others', value: 14700, percentage: '27%', color: '#1E293B' },
    ];
  }, [analyticsOverview]);

  const liveTotalExpenses = analyticsOverview?.summary?.total_expenses != null
    ? Number(analyticsOverview.summary.total_expenses)
    : monthlyExpenses;


  // SVG Sparkline helper
  const Sparkline = ({ points, color }: { points: number[]; color: string }) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 56;
    const height = 20;
    const path = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0 hidden xs:block">
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            Good morning, {user.name.split(' ')[0]} ☀️
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            A little progress each day goes a long way.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards: 2-Column Grid on mobile (360-430px), 4-Cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Net Worth */}
        <div className="card-fintech p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                Net Worth
              </span>
            </div>
            <Sparkline points={[10.5, 10.8, 11.2, 11.6, 12.1, 12.4]} color="#10B981" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight font-numeric truncate">
              {formatCurrency(netWorth)}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-0.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>+8.2%</span>
              <span className="hidden sm:inline text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="card-fintech p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                Income
              </span>
            </div>
            <Sparkline points={[80, 82, 82, 85, 85, 85]} color="#10B981" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight font-numeric truncate">
              {formatCurrency(monthlyIncome)}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-0.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>+3.1%</span>
              <span className="hidden sm:inline text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="card-fintech p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                Expenses
              </span>
            </div>
            <Sparkline points={[51, 53.5, 58, 52, 56, 54.2]} color="#EF4444" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight font-numeric truncate">
              {formatCurrency(monthlyExpenses)}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-rose-600 mt-0.5">
              <TrendingDown className="h-3 w-3 shrink-0" />
              <span>-4.5%</span>
              <span className="hidden sm:inline text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="card-fintech p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <span className="text-[10px] sm:text-xs font-bold">%</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                Savings Rate
              </span>
            </div>
            <Sparkline points={[22, 23, 20, 24, 26, 28]} color="#14B8A6" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight font-numeric truncate">
              {savingsRate}%
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-0.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>+2.4%</span>
              <span className="hidden sm:inline text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Single Column on Mobile, 12 Columns on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Section: Financial Health + Cash Flow + Donut + Goals */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5 min-w-0">
          {/* Row 1: Financial Health & Cash Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Financial Health Card */}
            <div className="card-fintech p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Financial Health</h3>
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <button
                    onClick={() => navigate('/financial-health')}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
                  >
                    <span>Full Report</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Score Gauge & Subtitle */}
                <div className="mt-3.5 flex items-center gap-3 sm:gap-4">
                  <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center">
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
                      <span className="text-xl sm:text-2xl font-black text-slate-900 font-numeric">72</span>
                      <span className="text-[9px] font-semibold text-slate-400 -mt-1">/ 100</span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-teal-800">Good Progress</h4>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      You're on track. Focus on emergency fund and reducing debt.
                    </p>
                  </div>
                </div>

                {/* Pillar Bars Breakdown */}
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Savings Discipline', value: 78, color: 'bg-teal-700' },
                    { label: 'Debt Management', value: 61, color: 'bg-amber-500' },
                    { label: 'Emergency Readiness', value: 54, color: 'bg-amber-400' },
                    { label: 'Spending Control', value: 73, color: 'bg-teal-600' },
                    { label: 'Investment Habits', value: 81, color: 'bg-teal-500' },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between text-[11px] sm:text-xs gap-2 sm:gap-3">
                      <span className="text-slate-600 font-medium truncate flex-1 min-w-0">{p.label}</span>
                      <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden shrink-0">
                        <div className={cn("h-full rounded-full", p.color)} style={{ width: `${p.value}%` }} />
                      </div>
                      <span className="text-slate-700 font-bold w-5 sm:w-6 text-right font-numeric">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cash Flow Card */}
            <div className="card-fintech p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Cash Flow</h3>
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-teal-600" /> Income
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-800" /> Expense
                    </span>
                  </div>
                </div>

                {/* Responsive Cash Flow Chart */}
                <div className="h-48 sm:h-56 mt-3 sm:mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9, fill: '#94A3B8' }}
                        tickFormatter={(v) => `₹${v / 1000}k`}
                      />
                      <Tooltip
                        formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                      />
                      <Bar dataKey="income" fill="#0D9488" radius={[3, 3, 0, 0]} maxBarSize={12} />
                      <Bar dataKey="expenses" fill="#1E293B" radius={[3, 3, 0, 0]} maxBarSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Where Your Money Goes + Your Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Where Your Money Goes Donut */}
            <div className="card-fintech p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Where Your Money Goes</h3>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50">
                  This month
                </span>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                {/* Donut Chart */}
                <div className="relative h-36 w-36 sm:h-40 sm:w-40 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={58}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-numeric">{formatCurrency(liveTotalExpenses)}</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Total Spent</span>
                  </div>

                </div>

                {/* Legend list */}
                <div className="flex-1 min-w-0 w-full space-y-1.5">
                  {spendingData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 text-[11px] sm:text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-numeric">
                        <span className="text-slate-400 text-[10px] font-medium">{item.percentage}</span>
                        <span className="text-slate-900 font-bold">₹{item.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Your Goals */}
            <div className="card-fintech p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Your Goals</h3>
                  <button
                    onClick={() => navigate('/goals')}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="mt-3 space-y-2.5">
                  {/* Emergency Fund */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Emergency Fund</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-teal-700">60%</span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 font-numeric">
                        ₹1,80,000 / <span className="text-slate-400 font-normal">₹3,00,000</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Dec 2027</span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>

                  {/* Buy a Car */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <Car className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Buy a Car</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-blue-600">30%</span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 font-numeric">
                        ₹2,40,000 / <span className="text-slate-400 font-normal">₹8,00,000</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Dec 2028</span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAddGoalOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:border-teal-600 hover:text-teal-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Goal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: AI Insights + Quick Actions + Quote */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5 min-w-0">
          {/* Quick Actions 4-Grid on mobile */}
          <div className="card-fintech p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Quick Actions</h3>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAddTransactionOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all active:scale-98"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
                <span className="mt-1 text-[11px] sm:text-xs font-bold text-slate-800">Add Entry</span>
              </button>

              <button
                onClick={() => setIsAddGoalOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all active:scale-98"
              >
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
                <span className="mt-1 text-[11px] sm:text-xs font-bold text-slate-800">Set Goal</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all active:scale-98"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
                <span className="mt-1 text-[11px] sm:text-xs font-bold text-slate-800">Import CSV</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all active:scale-98"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
                <span className="mt-1 text-[11px] sm:text-xs font-bold text-slate-800">Copilot Chat</span>
              </button>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="card-fintech p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" /> AI Insights
              </h3>
              <button
                onClick={() => navigate('/ai-report')}
                className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Insight 1 */}
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:p-3 hover:bg-slate-50 transition-colors">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 mt-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Spending increased</h4>
                    <span className="text-[9px] sm:text-[10px] text-slate-400">2h ago</span>
                  </div>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                    Dining expenses are 18% higher this month than average.
                  </p>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:p-3 hover:bg-slate-50 transition-colors">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Savings improved</h4>
                    <span className="text-[9px] sm:text-[10px] text-slate-400">1d ago</span>
                  </div>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                    Savings rate is now 28%, up from 23% last month.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Future Self Simulator CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F3D39] via-[#0D5C54] to-[#14B8A6] p-4 sm:p-6 text-white shadow-md">
            <div className="relative z-10 space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                See your future. Plan smarter.
              </h3>
              <p className="text-[11px] sm:text-xs text-teal-100 leading-relaxed">
                Simulate where your net worth could be in 5 or 10 years.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/future-self')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs border border-teal-500/30 transition-transform active:scale-95"
                >
                  <span>Try Simulator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
