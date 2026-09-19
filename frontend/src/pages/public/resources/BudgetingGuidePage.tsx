import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wallet,
  ArrowRight,
  CheckCircle2,
  PieChart,
  TrendingDown,
  Sparkles,
  Layers,
} from 'lucide-react';

export const BudgetingGuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <Wallet className="h-3.5 w-3.5 text-teal-600" />
            <span>Mastery Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            The Complete Guide to Modern Budgeting
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Budgeting isn't about deprivation—it's about intentional resource allocation. Learn how to stop lifestyle creep and eliminate unconscious spending leaks.
          </p>
        </div>
      </section>

      {/* Guide Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Methodologies */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Popular Budgeting Frameworks
          </h2>
          <p>
            Different personalities require different budgeting styles. Here are the three most proven approaches:
          </p>

          <div className="space-y-4 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">A. Zero-Based Budgeting (ZBB)</h3>
              <p className="text-xs text-slate-600">
                Every single rupee of income is assigned a specific job before the month starts (Income – Expenses – Savings = 0). There is no "untracked" leftover buffer.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">B. Pay Yourself First (Reverse Budgeting)</h3>
              <p className="text-xs text-slate-600">
                The moment your salary arrives, automatically transfer your target savings (e.g. 25%) to investment accounts. You are then free to spend the remainder without line-item guilt.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">C. Category Envelopes (Digital)</h3>
              <p className="text-xs text-slate-600">
                Cap discretionary spending by assigning digital limit caps to Groceries, Dining, and Entertainment. Once the category limit is exhausted, spending pauses until the next cycle.
              </p>
            </div>
          </div>
        </section>

        {/* Leaks */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Identifying Silent Expense Leaks
          </h2>
          <p>
            Most budget failures occur due to micro-transactions that slip past conscious attention:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-slate-600 text-xs">
            <li>Unused recurring streaming/gym subscriptions (FinSage alerts you automatically).</li>
            <li>Convenience surcharges on frequent instant grocery and food delivery orders.</li>
            <li>Impulsive weekend retail micro-purchases made via frictionless UPI taps.</li>
          </ul>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-teal-800 p-6 sm:p-8 text-white space-y-4">
          <h3 className="text-lg font-bold">Set your budget targets in FinSage</h3>
          <p className="text-xs text-teal-100 max-w-xl">
            Configure category spending caps and track progress with live progress indicators on the FinSage Budgets page.
          </p>
          <button
            onClick={() => navigate('/budgets')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-teal-900 shadow hover:bg-teal-50"
          >
            <span>Open Budgets Panel</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
