import React from 'react';
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
  HelpCircle,
  Car,
  Home,
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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    financialHealth,
    goals,
    insights,
    setIsAddTransactionOpen,
    setIsAddGoalOpen,
    setIsImportModalOpen,
    setIsChatOpen,
  } = useFinance();

  // Cash flow mock data for chart
  const cashFlowData = [
    { month: 'Apr', income: 82000, expenses: 51000 },
    { month: 'May', income: 82000, expenses: 53500 },
    { month: 'Jun', income: 85000, expenses: 58000 },
    { month: 'Jul', income: 85000, expenses: 52000 },
    { month: 'Aug', income: 98000, expenses: 56000 },
    { month: 'Sep', income: 85000, expenses: 54200 },
  ];

  // Where Your Money Goes donut data matching reference
  const spendingData = [
    { name: 'Housing', value: 18000, percentage: '33%', color: '#3B82F6' },
    { name: 'Food', value: 9200, percentage: '17%', color: '#10B981' },
    { name: 'Transport', value: 5400, percentage: '10%', color: '#06B6D4' },
    { name: 'Shopping', value: 4800, percentage: '9%', color: '#F59E0B' },
    { name: 'Subscriptions', value: 2100, percentage: '4%', color: '#8B5CF6' },
    { name: 'Others', value: 14700, percentage: '27%', color: '#1E293B' },
  ];

  // SVG Sparkline helpers
  const Sparkline = ({ points, color }: { points: number[]; color: string }) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 24;
    const path = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
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
    <div className="space-y-6">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Good morning, {user.name.split(' ')[0]} ☀️
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          A little progress each day goes a long way.
        </p>
      </div>

      {/* 4 Metric Cards Row (Matching Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="card-fintech p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500">Net Worth</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight font-numeric">
              {formatCurrency(netWorth)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>+8.2%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <Sparkline points={[10.5, 10.8, 11.2, 11.6, 12.1, 12.4]} color="#10B981" />
        </div>

        {/* Monthly Income */}
        <div className="card-fintech p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500">Monthly Income</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight font-numeric">
              {formatCurrency(monthlyIncome)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>+3.1%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <Sparkline points={[80, 82, 82, 85, 85, 85]} color="#10B981" />
        </div>

        {/* Monthly Expenses */}
        <div className="card-fintech p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500">Monthly Expenses</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight font-numeric">
              {formatCurrency(monthlyExpenses)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
              <TrendingDown className="h-3 w-3" />
              <span>-4.5%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <Sparkline points={[51, 53.5, 58, 52, 56, 54.2]} color="#EF4444" />
        </div>

        {/* Savings Rate */}
        <div className="card-fintech p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <span className="text-xs font-bold">%</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">Savings Rate</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight font-numeric">
              {savingsRate}%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>+2.4%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <Sparkline points={[22, 23, 20, 24, 26, 28]} color="#14B8A6" />
        </div>
      </div>

      {/* Main Grid 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-5">
          {/* Row 1: Financial Health + Cash Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Financial Health Card */}
            <div className="card-fintech p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900">Financial Health</h3>
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <button
                    onClick={() => navigate('/financial-health')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
                  >
                    <span>View Full Report</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Score Gauge & Subtitle */}
                <div className="mt-4 flex items-center gap-4">
                  {/* Circular Gauge */}
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
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
                      <span className="text-2xl font-black text-slate-900">72</span>
                      <span className="text-[10px] font-semibold text-slate-400 -mt-1">/ 100</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-teal-800">Good Progress</h4>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      You're on the right track. Focus on building your emergency fund and reducing debt.
                    </p>
                  </div>
                </div>

                {/* Pillar Bars Breakdown */}
                <div className="mt-5 space-y-2.5">
                  {[
                    { label: 'Savings Discipline', value: 78, color: 'bg-teal-700' },
                    { label: 'Debt Management', value: 61, color: 'bg-amber-500' },
                    { label: 'Emergency Readiness', value: 54, color: 'bg-amber-400' },
                    { label: 'Spending Control', value: 73, color: 'bg-teal-600' },
                    { label: 'Investment Habits', value: 81, color: 'bg-teal-500' },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between text-xs gap-3">
                      <span className="text-slate-600 font-medium w-36 truncate">{p.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={cn("h-full rounded-full", p.color)} style={{ width: `${p.value}%` }} />
                      </div>
                      <span className="text-slate-700 font-bold w-6 text-right">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cash Flow Card */}
            <div className="card-fintech p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Cash Flow</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-teal-600" /> Income
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-800" /> Expenses
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
                      Last 6 months ▾
                    </span>
                  </div>
                </div>

                {/* Cash Flow Recharts Bar */}
                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        tickFormatter={(v) => `₹${v / 1000}k`}
                      />
                      <Tooltip
                        formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="income" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="expenses" fill="#1E293B" radius={[4, 4, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Where Your Money Goes + Your Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Where Your Money Goes */}
            <div className="card-fintech p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Where Your Money Goes</h3>
                <span className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
                  This month ▾
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Donut Chart */}
                <div className="relative h-40 w-40 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={65}
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
                    <span className="text-sm font-bold text-slate-900 font-numeric">₹54,200</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Total Spent</span>
                  </div>
                </div>

                {/* Legend list with fixed column grid */}
                <div className="flex-1 min-w-0 w-full space-y-2">
                  {spendingData.map((item) => (
                    <div
                      key={item.name}
                      className="grid grid-cols-[8px_1fr_36px_68px] items-center gap-2 text-xs"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 font-medium truncate">{item.name}</span>
                      <span className="text-slate-400 text-[11px] text-right font-numeric font-medium">
                        {item.percentage}
                      </span>
                      <span className="text-slate-900 font-bold font-numeric text-right">
                        ₹{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Your Goals */}
            <div className="card-fintech p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Your Goals</h3>
                  <button
                    onClick={() => navigate('/goals')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Mini Goal Cards */}
                <div className="mt-4 space-y-3">
                  {/* Emergency Fund */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Emergency Fund</span>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-700">60%</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 font-numeric">
                        ₹1,80,000 / <span className="text-slate-400 font-normal">₹3,00,000</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Target: Dec 2027</span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>

                  {/* Buy a Car */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <Car className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Buy a Car</span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600">30%</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 font-numeric">
                        ₹2,40,000 / <span className="text-slate-400 font-normal">₹8,00,000</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Target: Dec 2028</span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAddGoalOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:border-teal-600 hover:text-teal-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Goal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Insights Card */}
          <div className="card-fintech p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">AI Insights</h3>
              <button
                onClick={() => navigate('/ai-report')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Insight 1: Spending Increased */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Spending increased</h4>
                    <span className="text-[10px] text-slate-400">2h ago</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Your dining expenses are 18% higher this month compared to your average.
                  </p>
                </div>
              </div>

              {/* Insight 2: Savings Improved */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Savings improved</h4>
                    <span className="text-[10px] text-slate-400">1d ago</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Your savings rate is now 28%, up from 23% last month.
                  </p>
                </div>
              </div>

              {/* Insight 3: High EMI burden */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">High EMI burden</h4>
                    <span className="text-[10px] text-slate-400">2d ago</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Your EMI payments are 28% of your monthly income. Consider refinancing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions 4-Grid */}
          <div className="card-fintech p-5">
            <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setIsAddTransactionOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all group"
              >
                <Plus className="h-5 w-5 text-teal-700 group-hover:scale-110 transition-transform" />
                <span className="mt-1.5 text-xs font-bold text-slate-800">Add Transaction</span>
              </button>

              <button
                onClick={() => setIsAddGoalOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all group"
              >
                <Target className="h-5 w-5 text-teal-700 group-hover:scale-110 transition-transform" />
                <span className="mt-1.5 text-xs font-bold text-slate-800">Set a Goal</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all group"
              >
                <Upload className="h-5 w-5 text-teal-700 group-hover:scale-110 transition-transform" />
                <span className="mt-1.5 text-xs font-bold text-slate-800">Import Statement</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center hover:border-teal-600 hover:bg-teal-50/30 transition-all group"
              >
                <MessageSquare className="h-5 w-5 text-teal-700 group-hover:scale-110 transition-transform" />
                <span className="mt-1.5 text-xs font-bold text-slate-800">Chat with FinSage</span>
              </button>
            </div>
          </div>

          {/* Quote Card */}
          <div className="card-fintech p-5 bg-gradient-to-br from-slate-50 to-teal-50/30 border-slate-200/80">
            <div className="flex items-start gap-2 text-slate-400">
              <span className="text-3xl font-serif text-teal-700 leading-none">“</span>
              <p className="text-xs italic text-slate-700 font-medium leading-relaxed">
                Discipline today, financial freedom tomorrow.
              </p>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[11px] font-semibold text-slate-400">— FinSage</span>
            </div>
            <div className="mt-4 border-t border-slate-200/60 pt-2 text-right">
              <span className="text-[10px] text-slate-400 block">Small steps today.</span>
              <span className="text-[10px] font-semibold text-teal-800">A secure tomorrow.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Future Self Banner CTA at Bottom (Matching Reference Landscape) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F3D39] via-[#0D5C54] to-[#14B8A6] p-6 sm:p-8 text-white shadow-md">
        {/* Soft mountain & hill silhouettes */}
        <div className="absolute right-0 bottom-0 top-0 w-full sm:w-1/2 opacity-25 pointer-events-none flex items-end justify-end">
          <svg viewBox="0 0 500 150" className="w-full h-full fill-white/40">
            <path d="M0,150 L100,60 L220,120 L340,30 L450,110 L500,70 L500,150 Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl space-y-2">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            See your future. Plan smarter.
          </h3>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Use our Future Self Simulator to explore where you could be in 5 or 10 years.
          </p>

          <div className="pt-2">
            <button
              onClick={() => navigate('/future-self')}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-950/80 hover:bg-teal-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm border border-teal-500/30 transition-all hover:scale-105"
            >
              <span>Try Future Self</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
