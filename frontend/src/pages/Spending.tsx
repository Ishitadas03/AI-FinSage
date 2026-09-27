import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  TrendingDown,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Tv,
  Zap,
  Filter,
  AlertCircle,
  Loader2,
  RefreshCw,
  CreditCard,
  Building2,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';

type TimeRangeKey = 'this_month' | '3_months' | '6_months' | 'ytd';

interface DateRangeOption {
  key: TimeRangeKey;
  label: string;
}

const TIME_RANGES: DateRangeOption[] = [
  { key: 'this_month', label: 'This Month' },
  { key: '3_months', label: 'Last 3 Months' },
  { key: '6_months', label: 'Last 6 Months' },
  { key: 'ytd', label: 'Year to Date (YTD)' },
];

const FIXED_CATEGORIES = new Set([
  'housing',
  'rent',
  'utilities',
  'utility',
  'subscription',
  'subscriptions',
  'insurance',
  'loan',
  'emi',
  'bills',
  'healthcare',
  'education',
]);

const getCategoryIcon = (categoryName: string) => {
  const lower = (categoryName || '').toLowerCase();
  if (lower.includes('house') || lower.includes('rent') || lower.includes('home')) return Home;
  if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant') || lower.includes('swiggy')) return Utensils;
  if (lower.includes('transport') || lower.includes('car') || lower.includes('fuel') || lower.includes('uber')) return Car;
  if (lower.includes('shop') || lower.includes('cloth') || lower.includes('amazon') || lower.includes('retail')) return ShoppingBag;
  if (lower.includes('sub') || lower.includes('media') || lower.includes('netflix') || lower.includes('stream')) return Tv;
  if (lower.includes('util') || lower.includes('bill') || lower.includes('power') || lower.includes('elec')) return Zap;
  return Layers;
};

const CATEGORY_COLORS = [
  '#0F766E', // Teal
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const Spending: React.FC = () => {
  const {
    accounts,
    analyticsOverview,
    isLoadingAnalytics,
    analyticsError,
    loadAnalytics,
  } = useFinance();

  const [timeRange, setTimeRange] = useState<TimeRangeKey>('6_months');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Compute ISO dates for filters
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = '';

    if (timeRange === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      start = first.toISOString().split('T')[0];
    } else if (timeRange === '3_months') {
      const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      start = first.toISOString().split('T')[0];
    } else if (timeRange === '6_months') {
      const first = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      start = first.toISOString().split('T')[0];
    } else if (timeRange === 'ytd') {
      const first = new Date(now.getFullYear(), 0, 1);
      start = first.toISOString().split('T')[0];
    }

    return { start_date: start, end_date: end };
  }, [timeRange]);

  // Fetch live analytics
  const fetchSpendingData = useCallback(() => {
    loadAnalytics({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      account_id: selectedAccountId !== 'all' ? selectedAccountId : undefined,
    });
  }, [loadAnalytics, dateRange, selectedAccountId]);

  useEffect(() => {
    fetchSpendingData();
  }, [fetchSpendingData]);

  // Calculations derived directly from backend response
  const summary = analyticsOverview?.summary;
  const totalExpenses = Number(summary?.total_expenses || 0);
  const totalIncome = Number(summary?.total_income || 0);
  const savingsRate = Number(summary?.savings_rate || 0);

  // Period days calculation
  const periodDays = useMemo(() => {
    if (!dateRange.start_date || !dateRange.end_date) return 30;
    const start = new Date(dateRange.start_date);
    const end = new Date(dateRange.end_date);
    const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return diff;
  }, [dateRange]);

  const dailyBurnRate = Math.round(totalExpenses / periodDays);

  // Categories & Outflows
  const spendingCategories = useMemo(() => {
    return (analyticsOverview?.spending_by_category || []).map((cat, idx) => ({
      name: cat.category,
      amount: Number(cat.amount),
      percentage: Number(cat.percentage),
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      icon: getCategoryIcon(cat.category),
    }));
  }, [analyticsOverview]);

  const topCategory = spendingCategories[0] || null;

  // Fixed vs Discretionary calculation
  const { fixedAmount, discretionaryAmount, fixedPct, discretionaryPct } = useMemo(() => {
    let fixed = 0;
    let disc = 0;
    spendingCategories.forEach((cat) => {
      const lower = cat.name.toLowerCase();
      const isFixed = Array.from(FIXED_CATEGORIES).some((term) => lower.includes(term));
      if (isFixed) {
        fixed += cat.amount;
      } else {
        disc += cat.amount;
      }
    });

    const total = fixed + disc;
    const fPct = total > 0 ? Math.round((fixed / total) * 100) : 0;
    const dPct = total > 0 ? 100 - fPct : 0;

    return {
      fixedAmount: fixed,
      discretionaryAmount: disc,
      fixedPct: fPct,
      discretionaryPct: dPct,
    };
  }, [spendingCategories]);

  // Trend formatting for AreaChart
  const trendData = useMemo(() => {
    return (analyticsOverview?.trend || []).map((t) => {
      const periodLabel = t.period.length === 10
        ? new Date(t.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : t.period.length === 7
        ? new Date(`${t.period}-01`).toLocaleDateString('en-US', { month: 'short' })
        : t.period;

      return {
        period: periodLabel,
        expenses: Number(t.expenses || 0),
        income: Number(t.income || 0),
        net: Number(t.net_cash_flow || 0),
      };
    });
  }, [analyticsOverview]);

  const topExpenses = analyticsOverview?.top_expenses || [];
  const accountBreakdowns = analyticsOverview?.account_breakdown || [];

  const hasData = (analyticsOverview?.top_expenses && analyticsOverview.top_expenses.length > 0) ||
    (analyticsOverview?.spending_by_category && analyticsOverview.spending_by_category.length > 0) ||
    totalExpenses > 0 || totalIncome > 0;

  return (
    <div className="space-y-6">
      {/* Header with Live Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Spending & Expense Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify spending leakages, analyze category distributions, and optimize discretionary outlays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              aria-label="Filter spending by account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.account_type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <select
            aria-label="Filter spending by time range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none cursor-pointer"
          >
            {TIME_RANGES.map((tr) => (
              <option key={tr.key} value={tr.key}>
                {tr.label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchSpendingData}
            disabled={isLoadingAnalytics}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh spending analytics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalytics ? 'animate-spin text-teal-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert with Retry State */}
      {analyticsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3 text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{analyticsError}</span>
          </div>
          <button
            onClick={fetchSpendingData}
            className="rounded-lg bg-rose-100 px-3 py-1 text-rose-800 font-bold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingAnalytics && !analyticsOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-fintech p-4 h-28 bg-slate-100/70" />
          ))}
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Spend in Period</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
            <span>{periodDays} days analyzed</span>
            {totalIncome > 0 && (
              <span className="text-teal-700">({savingsRate.toFixed(1)}% savings rate)</span>
            )}
          </div>
        </div>

        {/* Daily Burn Rate */}
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Daily Average Burn</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(dailyBurnRate)} / day
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Based on actual outflows in {TIME_RANGES.find((r) => r.key === timeRange)?.label}
          </p>
        </div>

        {/* Top Outflow Category */}
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Top Outflow Category</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric truncate">
            {topCategory ? `${topCategory.name} (${topCategory.percentage.toFixed(0)}%)` : 'No expenses recorded'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {topCategory ? formatCurrency(topCategory.amount) : '₹0.00'}
          </p>
        </div>

        {/* Fixed vs Discretionary */}
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Fixed vs Discretionary</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {totalExpenses > 0 ? `${fixedPct}% Fixed / ${discretionaryPct}% Disc.` : '0% / 0%'}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {formatCurrency(fixedAmount)} fixed vs {formatCurrency(discretionaryAmount)} discretionary
          </p>
        </div>
      </div>

      {/* Empty State */}
      {!isLoadingAnalytics && !hasData && (
        <div className="card-fintech p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No spending transactions in this range</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have recorded transactions matching this date filter. Try selecting a broader date range or import statements to visualize live metrics.
          </p>
        </div>
      )}

      {/* Spending Trend Trajectory Chart */}
      {trendData.length > 0 && (
        <div className="card-fintech p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Outflow & Cashflow Trajectory</h3>
              <p className="text-xs text-slate-400">Time-series trend of expenses and income over the selected period</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Outflow (Expenses)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Inflow (Income)
              </span>
            </div>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#0F766E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2-Column: Category Breakdown & Top Merchants / Accounts */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Category Breakdown (7 cols) */}
          <div className="lg:col-span-7 card-fintech p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Category Breakdown</h3>
              <span className="text-xs text-slate-400">{spendingCategories.length} Categories</span>
            </div>

            {spendingCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No categorized expenses in this period.</p>
            ) : (
              <div className="space-y-3">
                {spendingCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.name}
                      className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-100">
                            <Icon className="h-4 w-4" style={{ color: cat.color }} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                            <p className="text-[10px] text-slate-400">{cat.percentage.toFixed(1)}% of total outflows</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 font-numeric">
                            {formatCurrency(cat.amount)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Outflow Expenses & Account Outflows (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Top Expenses List */}
            <div className="card-fintech p-5">
              <h3 className="text-sm font-bold text-slate-900">Top Outflow Transactions</h3>
              <div className="mt-3.5 space-y-2.5">
                {topExpenses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No transactions recorded.</p>
                ) : (
                  topExpenses.slice(0, 6).map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {m.merchant || m.description || m.category}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {m.category} • {new Date(m.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-rose-600 font-numeric shrink-0">
                        {formatCurrency(Number(m.amount))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Account Outflows Breakdown */}
            {accountBreakdowns.length > 0 && (
              <div className="card-fintech p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">Outflows by Account</h3>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                    {accountBreakdowns.length} Accounts
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {accountBreakdowns.map((acc) => (
                    <div
                      key={acc.account_id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-800 truncate">{acc.account_name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{acc.account_type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 font-numeric block">
                          {formatCurrency(Number(acc.expenses))}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          +{formatCurrency(Number(acc.income))} in
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
