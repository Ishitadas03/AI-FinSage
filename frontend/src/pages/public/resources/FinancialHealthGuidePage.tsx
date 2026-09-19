import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  PieChart,
  CheckCircle2,
} from 'lucide-react';

export const FinancialHealthGuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <Activity className="h-3.5 w-3.5 text-teal-600" />
            <span>Health & Diagnostics</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            The Comprehensive Financial Health Guide
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Understand the 4 key metrics that determine your financial health score, and learn how to incrementally move from vulnerable to resilient.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            The 4 Vital Pillars of Financial Health
          </h2>
          <p>
            FinSage computes your composite health score (0–100) using four weighted telemetry pillars:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div className="text-xs font-bold text-teal-700">1. Liquidity Runway (30%)</div>
              <p className="text-xs text-slate-600">
                Number of months your household can sustain baseline living expenses if primary income stops tomorrow. Target: 6+ months.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div className="text-xs font-bold text-indigo-700">2. Savings Rate (25%)</div>
              <p className="text-xs text-slate-600">
                Percentage of monthly income channeled into investments, emergency buffers, or debt retirement. Target: 20%–35%.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div className="text-xs font-bold text-emerald-700">3. Debt-to-Income (25%)</div>
              <p className="text-xs text-slate-600">
                Total monthly EMI commitments divided by gross monthly take-home. Target: under 30% for optimal freedom.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div className="text-xs font-bold text-amber-700">4. Growth & Diversification (20%)</div>
              <p className="text-xs text-slate-600">
                Consistency of long-term investments across low-cost index funds, fixed income, and retirement funds.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Health Index Score Ranges
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <strong className="text-emerald-900">80 – 100: Thriving:</strong> Robust runway, low debt load, strong automated compounding habits.
            </div>
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs">
              <strong className="text-teal-900">60 – 79: Stable:</strong> Decent fundamentals, but may need deeper emergency reserves or debt consolidation.
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <strong className="text-amber-900">40 – 59: Vulnerable:</strong> High DTI ratio or under 2 months of liquidity runway.
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
              <strong className="text-rose-900">0 – 39: Critical:</strong> Spending exceeds income, reliance on revolving credit card balances.
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-teal-800 p-6 sm:p-8 text-white space-y-4">
          <h3 className="text-lg font-bold">Check your live Financial Health Index</h3>
          <p className="text-xs text-teal-100 max-w-xl">
            See your personalized 0–100 score and automated action items directly inside FinSage.
          </p>
          <button
            onClick={() => navigate('/financial-health')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-teal-900 shadow hover:bg-teal-50"
          >
            <span>View Financial Health Score</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
