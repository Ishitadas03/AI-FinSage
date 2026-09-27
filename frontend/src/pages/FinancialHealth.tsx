import React, { useEffect, useMemo, useCallback } from 'react';
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
  RefreshCw,
  CreditCard,
  Wallet,
  PieChart,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { HealthMetricItem } from '@/types/financialHealth';

export const FinancialHealth: React.FC = () => {
  const {
    financialHealthOverview,
    isLoadingFinancialHealth,
    financialHealthError,
    loadFinancialHealth,
    setIsChatOpen,
  } = useFinance();

  const fetchData = useCallback(() => {
    loadFinancialHealth();
  }, [loadFinancialHealth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pillar metric definitions
  const pillars = useMemo(() => {
    if (!financialHealthOverview) return [];

    const getMetricScore = (m?: HealthMetricItem): { score: number; label: string; color: string } => {
      if (!m || m.status === 'insufficient_data') {
        return { score: 0, label: 'Insufficient Data', color: 'text-slate-400 bg-slate-100' };
      }
      switch (m.status) {
        case 'healthy':
          return { score: 92, label: 'Healthy', color: 'text-emerald-700 bg-emerald-50' };
        case 'moderate':
          return { score: 68, label: 'Moderate', color: 'text-amber-700 bg-amber-50' };
        case 'critical':
          return { score: 35, label: 'Needs Attention', color: 'text-rose-700 bg-rose-50' };
        default:
          return { score: 50, label: m.status, color: 'text-slate-600 bg-slate-100' };
      }
    };

    const sRate = financialHealthOverview.savings_rate;
    const sRateInfo = getMetricScore(sRate);

    const expRatio = financialHealthOverview.expense_ratio;
    const expInfo = getMetricScore(expRatio);

    const emerg = financialHealthOverview.emergency_fund_coverage_months;
    const emergInfo = getMetricScore(emerg);

    const debtLiquid = financialHealthOverview.debt_to_liquid_ratio;
    const debtLiquidInfo = getMetricScore(debtLiquid);

    const investAlloc = financialHealthOverview.investment_allocation_ratio;
    const investInfo = getMetricScore(investAlloc);

    const ccUtil = financialHealthOverview.credit_card_utilization;
    const ccUtilInfo = getMetricScore(ccUtil);

    return [
      {
        name: 'Savings Discipline',
        metric: sRate?.value != null ? `${Number(sRate.value).toFixed(1)}${sRate.unit}` : 'N/A',
        benchmark: sRate?.benchmark || '>= 20% of net income',
        status: sRate?.status || 'insufficient_data',
        statusLabel: sRateInfo.label,
        statusColor: sRateInfo.color,
        score: sRateInfo.score,
        explanation: sRate?.explanation || 'Insufficient transaction data to measure monthly savings rate.',
      },
      {
        name: 'Expense Control',
        metric: expRatio?.value != null ? `${Number(expRatio.value).toFixed(1)}${expRatio.unit}` : 'N/A',
        benchmark: expRatio?.benchmark || '<= 70% of gross income',
        status: expRatio?.status || 'insufficient_data',
        statusLabel: expInfo.label,
        statusColor: expInfo.color,
        score: expInfo.score,
        explanation: expRatio?.explanation || 'Insufficient income/expense ledger history.',
      },
      {
        name: 'Emergency Readiness',
        metric: emerg?.value != null ? `${Number(emerg.value).toFixed(1)} ${emerg.unit}` : 'N/A',
        benchmark: emerg?.benchmark || '3 - 6 months of expenses',
        status: emerg?.status || 'insufficient_data',
        statusLabel: emergInfo.label,
        statusColor: emergInfo.color,
        score: emergInfo.score,
        explanation: emerg?.explanation || 'Liquid account balances and recurring expense history needed.',
      },
      {
        name: 'Debt-to-Liquid Ratio',
        metric: debtLiquid?.value != null ? `${Number(debtLiquid.value).toFixed(1)}${debtLiquid.unit}` : 'N/A',
        benchmark: debtLiquid?.benchmark || '<= 50% of liquid assets',
        status: debtLiquid?.status || 'insufficient_data',
        statusLabel: debtLiquidInfo.label,
        statusColor: debtLiquidInfo.color,
        score: debtLiquidInfo.score,
        explanation: debtLiquid?.explanation || 'Credit card debt vs liquid balances ratio.',
      },
      {
        name: 'Investment Allocation',
        metric: investAlloc?.value != null ? `${Number(investAlloc.value).toFixed(1)}${investAlloc.unit}` : 'N/A',
        benchmark: investAlloc?.benchmark || '>= 20% of net worth',
        status: investAlloc?.status || 'insufficient_data',
        statusLabel: investInfo.label,
        statusColor: investInfo.color,
        score: investInfo.score,
        explanation: investAlloc?.explanation || 'Investment account holdings relative to total assets.',
      },
      {
        name: 'Credit Card Utilization',
        metric: ccUtil?.value != null ? `${Number(ccUtil.value).toFixed(1)}${ccUtil.unit}` : 'N/A',
        benchmark: ccUtil?.benchmark || '< 30% of total limit',
        status: ccUtil?.status || 'insufficient_data',
        statusLabel: ccUtilInfo.label,
        statusColor: ccUtilInfo.color,
        score: ccUtilInfo.score,
        explanation: ccUtil?.explanation || 'Aggregate credit card balances relative to credit limits.',
      },
    ];
  }, [financialHealthOverview]);

  // Overall Score calculation based on calculable metrics
  const { overallScore, calculableCount, scoreLabel } = useMemo(() => {
    if (!pillars || pillars.length === 0) {
      return { overallScore: 0, calculableCount: 0, scoreLabel: 'No Data' };
    }

    const validPillars = pillars.filter((p) => p.status !== 'insufficient_data');
    if (validPillars.length === 0) {
      return { overallScore: 0, calculableCount: 0, scoreLabel: 'Insufficient Data' };
    }

    const sum = validPillars.reduce((acc, p) => acc + p.score, 0);
    const avg = Math.round(sum / validPillars.length);

    let label = 'Needs Improvement';
    if (avg >= 80) label = 'Excellent Health';
    else if (avg >= 65) label = 'Good Progress';
    else if (avg >= 50) label = 'Fair Baseline';

    return { overallScore: avg, calculableCount: validPillars.length, scoreLabel: label };
  }, [pillars]);

  // Deterministic Improvement Areas derived from live backend metrics
  const improvementAreas = useMemo(() => {
    if (!financialHealthOverview) return [];
    const items: { title: string; impact: string; action: string }[] = [];

    const emerg = financialHealthOverview.emergency_fund_coverage_months;
    if (emerg && (emerg.status === 'critical' || emerg.status === 'moderate')) {
      items.push({
        title: 'Build Emergency Fund Runway',
        impact: 'High Impact',
        action: `Your liquid reserves cover ${emerg.value != null ? `${Number(emerg.value).toFixed(1)} months` : 'under 3 months'}. Target building at least 3 to 6 months of mandatory living expenses in liquid savings.`,
      });
    }

    const cc = financialHealthOverview.credit_card_utilization;
    if (cc && (cc.status === 'critical' || cc.status === 'moderate')) {
      items.push({
        title: 'Optimize Credit Card Utilization',
        impact: 'High Impact',
        action: `Current credit utilization is ${cc.value != null ? `${Number(cc.value).toFixed(1)}%` : 'elevated'}. Pay down revolving balances to stay below 30% of total limit for credit score resilience.`,
      });
    }

    const sRate = financialHealthOverview.savings_rate;
    if (sRate && (sRate.status === 'critical' || sRate.status === 'moderate')) {
      items.push({
        title: 'Boost Monthly Savings Rate',
        impact: 'Medium Impact',
        action: `Current retention rate is ${sRate.value != null ? `${Number(sRate.value).toFixed(1)}%` : 'low'}. Cap discretionary expenses to move closer to the benchmark 20%+ savings rule.`,
      });
    }

    const inv = financialHealthOverview.investment_allocation_ratio;
    if (inv && (inv.status === 'critical' || inv.status === 'moderate')) {
      items.push({
        title: 'Grow Investment Portfolio Allocation',
        impact: 'Long-term Wealth',
        action: `Investments constitute ${inv.value != null ? `${Number(inv.value).toFixed(1)}%` : '0%'} of assets. Automate recurring SIPs into diversified index funds or deposits.`,
      });
    }

    return items;
  }, [financialHealthOverview]);

  // Deterministic Strengths
  const positiveHabits = useMemo(() => {
    if (!financialHealthOverview) return [];
    const habits: string[] = [];

    if (financialHealthOverview.savings_rate?.status === 'healthy') {
      habits.push(`Strong savings rate of ${Number(financialHealthOverview.savings_rate.value).toFixed(1)}%, surpassing the 20% benchmark.`);
    }
    if (financialHealthOverview.emergency_fund_coverage_months?.status === 'healthy') {
      habits.push(`Robust emergency buffer covering ${Number(financialHealthOverview.emergency_fund_coverage_months.value).toFixed(1)} months of living expenses.`);
    }
    if (financialHealthOverview.credit_card_utilization?.status === 'healthy') {
      habits.push(`Disciplined credit card utilization at ${Number(financialHealthOverview.credit_card_utilization.value).toFixed(1)}% (< 30% threshold).`);
    }
    if (financialHealthOverview.debt_to_liquid_ratio?.status === 'healthy') {
      habits.push('Debt-to-liquid assets ratio is well within safe thresholds.');
    }
    if (financialHealthOverview.investment_allocation_ratio?.status === 'healthy') {
      habits.push(`Solid investment allocation of ${Number(financialHealthOverview.investment_allocation_ratio.value).toFixed(1)}% of total net worth.`);
    }

    if (habits.length === 0 && calculableCount > 0) {
      habits.push('Financial foundation tracked across verified account balances.');
    }

    return habits;
  }, [financialHealthOverview, calculableCount]);

  const completenessNotes = financialHealthOverview?.data_completeness_notes || [];

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
            Deterministic multi-dimensional financial audit calculated directly from verified ledger accounts, loans, and cash flows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoadingFinancialHealth}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700 transition-colors disabled:opacity-50"
            title="Refresh Health Audit"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFinancialHealth ? 'animate-spin text-teal-700' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Ask AI Copilot for Advice</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {financialHealthError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3 text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{financialHealthError}</span>
          </div>
          <button
            onClick={fetchData}
            className="rounded-lg bg-rose-100 px-3 py-1 text-rose-800 font-bold hover:bg-rose-200"
          >
            Retry
          </button>
        </div>
      )}

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
                  className={cn(
                    overallScore >= 80 ? "text-emerald-600" :
                    overallScore >= 60 ? "text-teal-600" :
                    overallScore > 0 ? "text-amber-500" : "text-slate-300"
                  )}
                  strokeDasharray={`${calculableCount > 0 ? overallScore : 0}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 font-numeric">
                  {calculableCount > 0 ? overallScore : '—'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 -mt-1">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-teal-900">{scoreLabel}</h3>
                {calculableCount > 0 && (
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                    {calculableCount} of {pillars.length} Metrics Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                {calculableCount > 0
                  ? `Deterministic health index computed from your ${formatCurrency(Number(financialHealthOverview?.liquid_assets || 0))} liquid assets and periodic cash flow activity.`
                  : 'Add accounts and record transactions to compute your personalized financial health diagnostic.'}
              </p>
            </div>
          </div>

          {/* Quick Balance Baseline Metrics */}
          {financialHealthOverview && (
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Liquid Assets</span>
                <strong className="text-slate-900 font-numeric text-sm">
                  {formatCurrency(Number(financialHealthOverview.liquid_assets))}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Assets</span>
                <strong className="text-slate-900 font-numeric text-sm">
                  {formatCurrency(Number(financialHealthOverview.total_assets))}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Income</span>
                <strong className="text-emerald-700 font-numeric text-sm">
                  {formatCurrency(Number(financialHealthOverview.total_income))}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Expenses</span>
                <strong className="text-rose-600 font-numeric text-sm">
                  {formatCurrency(Number(financialHealthOverview.total_expenses))}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Completeness Notes Banner */}
      {completenessNotes.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Info className="h-4 w-4 text-amber-700" />
            <span>Data Completeness Diagnostics</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
            {completenessNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 5+ Pillars Deep Dive */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Pillar Diagnostic Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((p) => {
            const isInsufficient = p.status === 'insufficient_data';
            const isHealthy = p.status === 'healthy';
            const isModerate = p.status === 'moderate';

            return (
              <div key={p.name} className="card-fintech p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", p.statusColor)}>
                      {p.statusLabel}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isInsufficient ? "bg-slate-300" :
                          isHealthy ? "bg-emerald-600" :
                          isModerate ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${isInsufficient ? 0 : p.score}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <strong className="text-slate-800 font-semibold">{p.metric}</strong>
                      <span className="text-slate-400">{p.benchmark}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {p.explanation}
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
            High-Impact Optimization Recommendations
          </h3>

          {improvementAreas.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>All active financial health metrics are currently in optimal healthy ranges!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {improvementAreas.map((area, idx) => (
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
          )}
        </div>

        {/* Recognized Strengths */}
        <div className="lg:col-span-5 card-fintech p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" />
            Verified Financial Strengths
          </h3>

          <div className="space-y-2.5">
            {positiveHabits.map((habit, idx) => (
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
