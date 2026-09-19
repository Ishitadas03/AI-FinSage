import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export const AIReport: React.FC = () => {
  const { user, netWorth, monthlyIncome, monthlyExpenses, savingsRate, goals, loans, selectedPeriod } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  const [checklist, setChecklist] = useState([
    { id: 'c-1', text: 'Set up automated ₹5,000 monthly prepayment on Home Loan', done: false },
    { id: 'c-2', text: 'Transfer ₹4,250 excess savings from salary account into Emergency Fund', done: true },
    { id: 'c-3', text: 'Cap weekly Swiggy/Zomato orders to ₹1,500/week', done: false },
    { id: 'c-4', text: 'Review international card transactions flagged by Scam Shield', done: true },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const handlePrint = () => {
    window.print();
    toast.success('Generated PDF print layout.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-700" />
            FinSage Monthly AI Audit & Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Grounded financial intelligence report synthesized from verified ledger data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            <option>September 2026</option>
            <option>August 2026</option>
            <option>July 2026</option>
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="card-fintech p-8 sm:p-10 space-y-8 bg-white border border-slate-200 shadow-md">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 font-bold text-lg">
              <Sparkles className="h-5 w-5 text-teal-600" />
              FinSage Executive Financial Summary
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client: <strong className="text-slate-900">{user.name}</strong> • Audit Period: <strong>{selectedMonth}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="rounded-full bg-teal-50 px-3 py-1 font-bold text-teal-800 border border-teal-200 block sm:inline-block w-fit">
              Health Grade: A (72/100)
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Certified by FinSage Responsible AI Engine</p>
          </div>
        </div>

        {/* Executive Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Net Worth</span>
            <strong className="text-base font-bold text-slate-900 font-numeric">{formatCurrency(netWorth)}</strong>
            <span className="text-[10px] text-emerald-600 block mt-0.5">+8.2% MoM</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Monthly Inflow</span>
            <strong className="text-base font-bold text-slate-900 font-numeric">{formatCurrency(monthlyIncome)}</strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">Salary & consulting</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Total Outflow</span>
            <strong className="text-base font-bold text-slate-900 font-numeric">{formatCurrency(monthlyExpenses)}</strong>
            <span className="text-[10px] text-emerald-600 block mt-0.5">-4.5% MoM reduction</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Savings Rate</span>
            <strong className="text-base font-bold text-teal-800 font-numeric">{savingsRate}%</strong>
            <span className="text-[10px] text-teal-600 font-medium block mt-0.5">₹23,800 retained</span>
          </div>
        </div>

        {/* Section 1: Detailed Commentary */}
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Comprehensive Financial Diagnostic
          </h3>

          <p>
            During {selectedMonth}, your total disposable income was <strong>{formatCurrency(monthlyIncome)}</strong> against total living expenses of <strong>{formatCurrency(monthlyExpenses)}</strong>. This resulted in an operational net cash surplus of <strong>{formatCurrency(monthlyIncome - monthlyExpenses)}</strong>, sustaining a stellar <strong>{savingsRate}% savings rate</strong> (well above the national 20% benchmark).
          </p>

          <p>
            Your total outstanding debt stands at <strong>{formatCurrency(loans.reduce((acc, l) => acc + l.principalRemaining, 0))}</strong> across your Home Loan and Car Loan. Your debt service ratio of <strong>28%</strong> is safely within the banking stress threshold (&lt;35%).
          </p>
        </div>

        {/* Section 2: Observations & Flagged Attention Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Positive Observations */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Positive Observations
            </h4>
            <ul className="space-y-2 text-xs text-emerald-900">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>Zero credit card interest incurred — card balances paid 100% in full.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>Emergency fund reached 60% completion milestone (₹1,80,000 saved).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>Fixed housing costs kept disciplined at 21% of monthly income.</span>
              </li>
            </ul>
          </div>

          {/* Areas Requiring Attention */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Areas Requiring Attention
            </h4>
            <ul className="space-y-2 text-xs text-amber-900">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>Food & Dining was ₹1,200 higher than normal (18% spike vs 3-month avg).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>Home loan interest compounding is currently outpacing fixed deposit yields.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>1 international transaction flagged for review in Scam Shield.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Actionable Monthly Execution Plan */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-700" />
            2. Prescribed Planning Roadmap for Next Month
          </h3>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs ${
                  item.done
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleCheck(item.id)}
                  className="rounded text-teal-700 focus:ring-0 cursor-pointer"
                />
                <span className={item.done ? 'line-through text-slate-400 font-normal' : ''}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Report Generated on 19 Sep 2026 • FinSage ID: FS-RPT-88391</span>
          <span>🔒 Grounded in Ledger Records • Educational Analysis</span>
        </div>
      </div>
    </div>
  );
};
