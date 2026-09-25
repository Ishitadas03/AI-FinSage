import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export const MarketIntel: React.FC = () => {
  const {
    marketHoldings,
    marketIndices,
    totalPortfolioValue,
    totalPortfolioInvested,
    totalPortfolioPnl,
    totalPortfolioPnlPercent,
  } = useFinance();

  const [assetFilter, setAssetFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Asset allocation pie data
  const allocationData = [
    { name: 'Mutual Funds / Index ETFs', value: 236640, color: '#0F766E' },
    { name: 'Direct Equity / Bluechips', value: 230662, color: '#3B82F6' },
    { name: 'Digital Gold (Gold BeES)', value: 69160, color: '#F59E0B' },
    { name: 'Fixed Deposits & Liquid', value: 53600, color: '#10B981' },
  ];

  // Filtered holdings
  const filteredHoldings = marketHoldings.filter((h) => {
    if (assetFilter !== 'All' && h.assetClass !== assetFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return h.symbol.toLowerCase().includes(q) || h.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Curated Educational News / Market Intelligence
  const marketNews = [
    {
      title: 'RBI Keeps Repo Rate Steady: Favorable Window for Long-Term Home Loan Prepayments',
      source: 'FinSage Macro Intel',
      time: '3 hours ago',
      category: 'Monetary Policy',
    },
    {
      title: 'Nifty 50 Large-Cap Inflows Surge 14% as Retail SIP Participation Hits New High',
      source: 'Capital Market Journal',
      time: '6 hours ago',
      category: 'Equities',
    },
    {
      title: 'Sovereign Gold Bond Tranche Yields vs Physical Gold ETF Cost-Efficiency Breakdown',
      source: 'Wealth Analytics',
      time: '1 day ago',
      category: 'Commodities',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-teal-700" />
            Market Intel & Portfolio Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time equity valuations, asset allocation balance, and institutional market intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Market Feeds Live</span>
          </span>
        </div>
      </div>

      {/* Live Market Indices Ticker Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {marketIndices.map((idx) => (
          <div key={idx.name} className="card-fintech p-3 text-xs space-y-1">
            <span className="text-slate-400 font-semibold text-[11px] block">{idx.name}</span>
            <div className="text-sm font-bold text-slate-900 font-numeric">
              {idx.value.toLocaleString()}
            </div>
            <div className={cn("flex items-center gap-1 text-[10px] font-bold", idx.isPositive ? "text-emerald-600" : "text-rose-600")}>
              {idx.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{idx.isPositive ? '+' : ''}{idx.changePercent}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="card-fintech p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Portfolio Value</span>
          <div className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalPortfolioValue)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Live market valuation</p>
        </div>

        <div className="card-fintech p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Capital Invested</span>
          <div className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalPortfolioInvested)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Net acquisition cost</p>
        </div>

        <div className="card-fintech p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">All-Time Returns</span>
          <div className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-emerald-700 font-numeric">
            +{formatCurrency(totalPortfolioPnl)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 sm:mt-1">+{totalPortfolioPnlPercent}% Return</p>
        </div>

        <div className="card-fintech p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">1-Day Change</span>
          <div className="mt-1 sm:mt-2 text-base sm:text-xl font-bold text-emerald-700 font-numeric">
            +₹3,420
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 sm:mt-1">+0.59% Today</p>
        </div>
      </div>

      {/* 2-Column: Holdings Table (8 cols) + Asset Allocation Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-8 card-fintech p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Investment Holdings</h3>
              <p className="text-xs text-slate-400">Synced with Zerodha & Groww Demat feeds</p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="All">All Assets</option>
                <option value="Stocks">Stocks</option>
                <option value="Mutual Funds">Mutual Funds</option>
                <option value="Gold">Gold</option>
                <option value="Fixed Deposit">Fixed Deposit</option>
              </select>

              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none flex-1 sm:flex-initial sm:w-40"
              />
            </div>
          </div>

          {/* Mobile Holdings Card List (Hidden on desktop) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredHoldings.map((h) => (
              <div key={h.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{h.symbol}</span>
                    <span className="block text-[10px] text-slate-400 truncate max-w-[180px]">{h.name}</span>
                  </div>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                    {h.assetClass}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current LTP</span>
                    <span className="font-semibold text-slate-800 font-numeric">₹{h.currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Holding Value</span>
                    <span className="font-bold text-slate-900 font-numeric">{formatCurrency(h.currentValue)}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Total Gain / Loss</span>
                    <span className={cn("font-bold font-numeric", h.pnl >= 0 ? 'text-emerald-700' : 'text-rose-600')}>
                      {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)} ({h.pnlPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Avg Price</th>
                  <th className="py-2.5 px-3 text-right">Current LTP</th>
                  <th className="py-2.5 px-3 text-right">Holding Value</th>
                  <th className="py-2.5 px-3 text-right">Total Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHoldings.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{h.symbol}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{h.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        {h.assetClass}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-numeric text-slate-600">
                      ₹{h.avgBuyPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-numeric font-semibold text-slate-900">
                      ₹{h.currentPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-numeric font-bold text-slate-900">
                      {formatCurrency(h.currentValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-numeric font-bold">
                      <span className={h.pnl >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)} ({h.pnlPercentage}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Allocation Donut */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-fintech p-5">
            <h3 className="text-sm font-bold text-slate-900">Asset Allocation Strategy</h3>
            <p className="text-xs text-slate-400">Target: 60% Equity / 25% Debt / 15% Gold</p>

            <div className="relative h-48 w-full mt-3 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`₹${val.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-xs font-bold text-slate-900">Balanced</span>
                <span className="block text-[9px] text-slate-400">Risk Profile</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs mt-3">
              {allocationData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 font-numeric text-[11px]">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Market Intel */}
          <div className="card-fintech p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Curated Market Intel</h3>
            <div className="space-y-3">
              {marketNews.map((news, idx) => (
                <div key={idx} className="space-y-1 pb-2 border-b border-slate-100 last:border-0 text-xs">
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                    {news.category}
                  </span>
                  <h4 className="font-semibold text-slate-900 leading-snug hover:text-teal-700 cursor-pointer">
                    {news.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">{news.source} • {news.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
