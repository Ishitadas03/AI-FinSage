import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const EmergencyFundGuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Safety Buffer Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Building an Unshakeable Emergency Fund
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Your emergency fund is the financial airbag that protects your long-term investments from untimely liquidations during medical shocks or career pauses.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            1. How Big Should Your Emergency Fund Be?
          </h2>
          <p>
            The recommended target depends directly on income stability and dependent responsibilities:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">3 Months Expenses</h3>
              <p className="text-xs text-slate-600">
                Single professionals with dual-income households, zero dependents, and secure salaried positions.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-teal-200 bg-teal-50/30 space-y-2">
              <h3 className="font-bold text-teal-900 text-sm">6 Months (Recommended)</h3>
              <p className="text-xs text-slate-600">
                Standard benchmark for households with children, EMIs, or single-earner family setups.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">9–12 Months</h3>
              <p className="text-xs text-slate-600">
                Freelancers, entrepreneurs, business owners, and commission-based variable earners.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            2. Where to Park Your Emergency Fund
          </h2>
          <p>
            An emergency fund is for safety and liquidity—NOT for chasing maximum speculative yields. Allocate across:
          </p>
          <ul className="space-y-2.5 pl-4 list-disc text-slate-600 text-xs">
            <li><strong>High-Yield Savings Accounts (20%):</strong> Instant zero-notice debit card access.</li>
            <li><strong>Sweep-In Bank Fixed Deposits (50%):</strong> Higher interest without exit penalties on emergency breaks.</li>
            <li><strong>Ultra-Short Term / Liquid Mutual Funds (30%):</strong> T+1 redemption with indexation benefits.</li>
          </ul>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-teal-800 p-6 sm:p-8 text-white space-y-4">
          <h3 className="text-lg font-bold">Track your emergency runway target</h3>
          <p className="text-xs text-teal-100 max-w-xl">
            FinSage continuously calculates your months of runway based on real monthly outflow averages.
          </p>
          <button
            onClick={() => navigate('/goals')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-teal-900 shadow hover:bg-teal-50"
          >
            <span>Create Emergency Goal</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
