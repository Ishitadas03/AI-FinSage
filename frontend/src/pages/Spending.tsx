import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Repeat,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Tv,
  Zap,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';

export const Spending: React.FC = () => {
  const { monthlyExpenses } = useFinance();
  const [timeRange, setTimeRange] = useState('Last 6 Months');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Trend data
  const spendingTrend = [
    { month: 'Apr', amount: 51000, discretionary: 18000, fixed: 33000 },
    { month: 'May', amount: 53500, discretionary: 20500, fixed: 33000 },
    { month: 'Jun', amount: 58000, discretionary: 25000, fixed: 33000 },
    { month: 'Jul', amount: 52000, discretionary: 19000, fixed: 33000 },
    { month: 'Aug', amount: 56000, discretionary: 23000, fixed: 33000 },
    { month: 'Sep', amount: 54200, discretionary: 21200, fixed: 33000 },
  ];

  // Category Breakdown Data
  const categories = [
    { name: 'Housing & Rent', amount: 18000, percent: 33.2, icon: Home, color: '#3B82F6', change: '+0.0%', status: 'Normal' },
    { name: 'Food & Dining', amount: 9200, percent: 17.0, icon: Utensils, color: '#10B981', change: '+18.4%', status: 'Higher than usual' },
    { name: 'Transportation', amount: 5400, percent: 10.0, icon: Car, color: '#06B6D4', change: '-5.2%', status: 'Normal' },
    { name: 'Shopping & E-Commerce', amount: 4800, percent: 8.8, icon: ShoppingBag, color: '#F59E0B', change: '-12.0%', status: 'Disciplined' },
    { name: 'Subscriptions & Media', amount: 2100, percent: 3.9, icon: Tv, color: '#8B5CF6', change: '+0.0%', status: 'Recurring' },
    { name: 'Utilities & Healthcare', amount: 14700, percent: 27.1, icon: Zap, color: '#0F766E', change: '+3.5%', status: 'Normal' },
  ];

  // Top Merchants list
  const topMerchants = [
    { name: 'Prestige Hiranandani', category: 'Housing', amount: 18000, orders: 1 },
    { name: 'Swiggy & Zomato', category: 'Food & Dining', amount: 5370, orders: 8 },
    { name: 'Amazon India', category: 'Shopping', amount: 4800, orders: 3 },
    { name: 'Nature\'s Basket', category: 'Groceries', amount: 3830, orders: 2 },
    { name: 'Indian Oil & Shell', category: 'Transport', amount: 3120, orders: 2 },
  ];

  // Recurring Subscriptions
  const recurringSubscriptions = [
    { name: 'Hiranandani Rent', amount: 18000, frequency: 'Monthly', nextDue: '01 Oct 2026', type: 'Rent' },
    { name: 'Tata Power Electricity', amount: 3200, frequency: 'Monthly', nextDue: '08 Oct 2026', type: 'Utility' },
    { name: 'Airtel Fiber Broadband', amount: 1199, frequency: 'Monthly', nextDue: '03 Oct 2026', type: 'Internet' },
    { name: 'Netflix Premium 4K', amount: 649, frequency: 'Monthly', nextDue: '10 Oct 2026', type: 'Media' },
    { name: 'Cult.fit Gym & Fitness', amount: 5800, frequency: 'Annual (₹483/mo)', nextDue: '01 Sep 2027', type: 'Fitness' },
    { name: 'Spotify Family Plan', amount: 179, frequency: 'Monthly', nextDue: '09 Oct 2026', type: 'Media' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Spending & Expense Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify spending leakages, recurring charges, and optimize discretionary outlays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            <option>This Month (Sep 2026)</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Year to Date (2026)</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Spend this Month</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(monthlyExpenses)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>-4.5%</span>
            <span className="text-slate-400 font-normal">vs previous month</span>
          </div>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Daily Average Burn</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(Math.round(monthlyExpenses / 30))} / day
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Safe burn rate: &lt;₹2,100/day</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Top Outflow Category</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            Housing (33%)
          </div>
          <p className="text-[11px] text-slate-500 mt-1">₹18,000 / month</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Fixed vs Discretionary</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            61% Fixed / 39% Disc.
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Ideal 50-30-20 alignment</p>
        </div>
      </div>

      {/* Spending Trend Chart */}
      <div className="card-fintech p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Spending Trajectory</h3>
            <p className="text-xs text-slate-400">Comparing Fixed living costs vs Discretionary lifestyle spending</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Total Outflow
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Discretionary
            </span>
          </div>
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="discColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Area type="monotone" dataKey="amount" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#totalColor)" />
              <Area type="monotone" dataKey="discretionary" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#discColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column: Category Breakdown & Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Breakdown list (7 cols) */}
        <div className="lg:col-span-7 card-fintech p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Category Breakdown & Variance</h3>
            <span className="text-xs text-slate-400">vs 3-Month Average</span>
          </div>

          <div className="space-y-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-100">
                      <Icon className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                      <p className="text-[10px] text-slate-400">{cat.percent}% of total budget • {cat.status}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 font-numeric">
                      {formatCurrency(cat.amount)}
                    </div>
                    <span className={`text-[10px] font-semibold ${cat.change.startsWith('+') && cat.name.includes('Food') ? 'text-amber-600' : 'text-slate-400'}`}>
                      {cat.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Merchants & Recurring Spends (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Top Merchants */}
          <div className="card-fintech p-5">
            <h3 className="text-sm font-bold text-slate-900">Top Outflow Merchants</h3>
            <div className="mt-3.5 space-y-2.5">
              {topMerchants.map((m, idx) => (
                <div key={m.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.orders} transaction{m.orders > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 font-numeric">{formatCurrency(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriptions Card */}
          <div className="card-fintech p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Recurring Bills & Subscriptions</h3>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                6 Active
              </span>
            </div>

            <div className="mt-3.5 space-y-2 max-h-56 overflow-y-auto pr-1">
              {recurringSubscriptions.map((sub) => (
                <div key={sub.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{sub.name}</p>
                    <p className="text-[10px] text-slate-400">Next due: {sub.nextDue}</p>
                  </div>
                  <span className="font-bold text-slate-900 font-numeric">{formatCurrency(sub.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
