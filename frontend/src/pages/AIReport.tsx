import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  PieChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const AIReport: React.FC = () => {
  const {
    user,
    monthlyReport,
    isLoadingMonthlyReport,
    monthlyReportError,
    loadMonthlyReport,
    isAuthenticated,
  } = useFinance();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [checklistCompleted, setChecklistCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadMonthlyReport(selectedMonth);
  }, [selectedMonth, loadMonthlyReport]);

  const toggleCheck = (idx: number) => {
    setChecklistCompleted((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handlePrint = () => {
    window.print();
    toast.success('Generated PDF print preview.');
  };

  const monthOptions = [
    { label: 'Current Month (Live)', value: currentMonthStr },
    { label: 'September 2026', value: '2026-09' },
    { label: 'August 2026', value: '2026-08' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'May 2026', value: '2026-05' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-700" />
            FinSage Monthly Financial Diagnostic Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Grounded financial intelligence synthesized from verified authenticated ledger records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={isLoadingMonthlyReport}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-teal-600 disabled:opacity-50"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadMonthlyReport(selectedMonth)}
            disabled={isLoadingMonthlyReport}
            title="Refresh Report"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoadingMonthlyReport && "animate-spin text-teal-600")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isLoadingMonthlyReport || !monthlyReport}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {monthlyReportError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{monthlyReportError}</span>
          </div>
          <button
            onClick={() => loadMonthlyReport(selectedMonth)}
            className="font-bold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingMonthlyReport && !monthlyReport && (
        <div className="card-fintech p-12 text-center space-y-3 bg-white border border-slate-200">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Generating Monthly Financial Audit...</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Synthesizing transaction inflows, outflows, budget utilization, recurring bills, and health indicators.
          </p>
        </div>
      )}

      {/* Report Document Sheet */}
      {monthlyReport && (
        <div className="card-fintech p-4 sm:p-8 lg:p-10 space-y-8 bg-white border border-slate-200 shadow-md">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-lg">
                <Sparkles className="h-5 w-5 text-teal-600" />
                FinSage Executive Financial Summary
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Client: <strong className="text-slate-900">{user.name}</strong> • Audit Period: <strong>{monthlyReport.period.month_label}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1">
              <span className="rounded-full bg-teal-50 px-3 py-1 font-bold text-teal-800 border border-teal-200 block sm:inline-block w-fit">
                Health Grade: {monthlyReport.financial_health.grade} ({monthlyReport.financial_health.score}/100)
              </span>
              <p className="text-[10px] text-slate-400">
                Grounded by FinSage Deterministic Analytics Engine
              </p>
            </div>
          </div>

          {/* Missing data notes / warnings */}
          {monthlyReport.missing_data_notes && monthlyReport.missing_data_notes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-1 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Data Completeness Notice</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pl-1">
                {monthlyReport.missing_data_notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Executive Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Total Income</span>
              <strong className="text-base font-bold text-slate-900 font-numeric">
                {formatCurrency(monthlyReport.summary.total_income)}
              </strong>
              {monthlyReport.comparison.has_previous_period && monthlyReport.comparison.income_change_pct !== null && (
                <span className={cn("text-[10px] block mt-0.5 font-semibold", (monthlyReport.comparison.income_change_pct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {(monthlyReport.comparison.income_change_pct ?? 0) >= 0 ? '+' : ''}
                  {monthlyReport.comparison.income_change_pct}% MoM
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Total Expenses</span>
              <strong className="text-base font-bold text-slate-900 font-numeric">
                {formatCurrency(monthlyReport.summary.total_expenses)}
              </strong>
              {monthlyReport.comparison.has_previous_period && monthlyReport.comparison.expense_change_pct !== null && (
                <span className={cn("text-[10px] block mt-0.5 font-semibold", (monthlyReport.comparison.expense_change_pct ?? 0) <= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {(monthlyReport.comparison.expense_change_pct ?? 0) > 0 ? '+' : ''}
                  {monthlyReport.comparison.expense_change_pct}% MoM
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Net Surplus</span>
              <strong className={cn("text-base font-bold font-numeric", monthlyReport.summary.net_savings >= 0 ? "text-slate-900" : "text-rose-600")}>
                {formatCurrency(monthlyReport.summary.net_savings)}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {monthlyReport.summary.transaction_count} transactions logged
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Savings Rate</span>
              <strong className="text-base font-bold text-teal-800 font-numeric">
                {monthlyReport.summary.savings_rate}%
              </strong>
              <span className="text-[10px] text-teal-600 font-medium block mt-0.5">
                Burn: {formatCurrency(monthlyReport.summary.burn_rate_daily)}/day
              </span>
            </div>
          </div>

          {/* Section 1: Executive AI Diagnostic */}
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              1. Executive Diagnostic & Key Takeaways
            </h3>
            <div className="prose prose-sm text-slate-800 whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
              {monthlyReport.executive_summary}
            </div>
          </div>

          {/* Section 2: Spending by Category & Largest Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Category Breakdown Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-teal-700" />
                Category Spending Breakdown
              </h4>
              {monthlyReport.categories.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 border border-dashed rounded-xl text-center">
                  No categorized expenses recorded in this period.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyReport.categories.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-medium capitalize text-slate-800">{c.category}</td>
                          <td className="py-2 px-3 text-right font-numeric font-semibold text-slate-900">
                            {formatCurrency(c.amount)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500 font-numeric">{c.percentage_of_total}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top 5 Expenses */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-teal-700" />
                Top Recorded Expenses
              </h4>
              {monthlyReport.top_expenses.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 border border-dashed rounded-xl text-center">
                  No individual expenses recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {monthlyReport.top_expenses.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 block">{tx.merchant}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{tx.category} • {tx.date}</span>
                      </div>
                      <span className="font-bold text-rose-600 font-numeric">
                        -{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Budget Utilization & Audit */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              2. Budget Utilization & Overrun Audit
            </h3>
            {monthlyReport.budget_audit.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 border border-slate-100">
                No category budgets configured. Add monthly budgets to monitor spending caps and overruns.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {monthlyReport.budget_audit.map((b, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3.5 rounded-xl border text-xs space-y-2",
                      b.is_overrun ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold capitalize text-slate-900">{b.category}</span>
                      {b.is_overrun ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Over Budget (+{formatCurrency(b.overrun_amount)})
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {b.utilization_pct}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Spent: <strong>{formatCurrency(b.spent)}</strong></span>
                      <span>Limit: {formatCurrency(b.allocated)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", b.is_overrun ? "bg-rose-500" : b.utilization_pct > 80 ? "bg-amber-500" : "bg-teal-600")}
                        style={{ width: `${Math.min(100, b.utilization_pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Upcoming Obligations (Recurring Bills & EMIs) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-700" />
              3. Scheduled Bills & Loan Obligations
            </h3>
            {monthlyReport.upcoming_obligations.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 border border-slate-100">
                No active recurring bills or loan EMIs scheduled for this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {monthlyReport.upcoming_obligations.map((o, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">{o.name}</span>
                      <span className="font-bold text-slate-900 font-numeric">{formatCurrency(o.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="capitalize">{o.type.replace('_', ' ')} • {o.frequency}</span>
                      <span>Due: <strong>{o.due_date}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Actionable Checklist */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-700" />
              4. Prescribed Action Plan for Next Month
            </h3>

            {monthlyReport.action_checklist.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 border border-slate-100">
                No active checklist items generated for this period.
              </p>
            ) : (
              <div className="space-y-2">
                {monthlyReport.action_checklist.map((item, idx) => {
                  const isDone = checklistCompleted[idx] || false;
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs",
                        isDone
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 font-medium"
                          : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleCheck(idx)}
                        className="mt-0.5 rounded text-teal-700 focus:ring-0 cursor-pointer"
                      />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn("font-semibold", isDone ? "line-through text-slate-400" : "text-slate-900")}>
                            {item.title}
                          </span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                            item.priority === 'high' ? "bg-rose-100 text-rose-700" : item.priority === 'medium' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <p className={cn("text-[11px]", isDone ? "line-through text-slate-400" : "text-slate-600")}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>Report Generated on {new Date(monthlyReport.generated_at).toLocaleDateString()} • FinSage Verified Report</span>
            <span>🔒 Grounded Exclusively in Ledger Records</span>
          </div>
        </div>
      )}
    </div>
  );
};
