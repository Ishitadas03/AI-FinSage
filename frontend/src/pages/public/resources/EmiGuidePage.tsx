import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Landmark,
  ArrowRight,
  Calculator,
  Percent,
  TrendingDown,
  Info,
  Sparkles,
} from 'lucide-react';

export const EmiGuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <Landmark className="h-3.5 w-3.5 text-teal-600" />
            <span>Debt & Loan Masterclass</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Understanding EMIs, Interest Rates & Prepayment
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Demystify loan mechanics, reducing-balance interest calculations, and discover how small, regular prepayments can save lakhs in interest charges.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            1. Reducing Balance vs. Flat Rate Loans
          </h2>
          <p>
            When banks quote an interest rate, the compounding method determines how much you actually pay:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Reducing Balance (Standard)</h3>
              <p className="text-xs text-slate-600">
                Interest is calculated only on the remaining unpaid principal at the end of each month. As you repay principal, monthly interest charges decline over time.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-2">
              <h3 className="font-bold text-rose-900 text-sm">Flat Rate (Misleading)</h3>
              <p className="text-xs text-slate-600">
                Interest is calculated on the entire original principal for the full duration. An 8% flat rate is actually equivalent to ~14.5% reducing rate!
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            2. The Power of Loan Prepayments
          </h2>
          <p>
            In the early years of a 15–20 year home loan, up to 70% of your EMI goes towards interest alone rather than reducing principal.
          </p>
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-2">
            <div className="font-bold">💡 The 1-Extra-EMI Trick:</div>
            <p>
              Paying just 1 additional EMI every year (or increasing your EMI by 5% annually) can reduce a 20-year home loan tenure down to ~14 years and save over 35% in lifetime interest.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            3. Debt-to-Income (DTI) Guardrails
          </h2>
          <p>
            Your total monthly EMI obligations across all loans (home, car, credit cards) should ideally stay below <strong>35%–40%</strong> of your net monthly take-home income to avoid debt distress.
          </p>
        </section>

        {/* Action Card */}
        <div className="rounded-2xl bg-teal-800 p-6 sm:p-8 text-white space-y-4">
          <h3 className="text-lg font-bold">Calculate your EMI and interest savings</h3>
          <p className="text-xs text-teal-100 max-w-xl">
            Use our interactive mathematical calculator to simulate loans and prepayment schedules.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/tools/emi-calculator"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-teal-900 shadow hover:bg-teal-50"
            >
              <span>Use EMI Calculator</span>
              <Calculator className="h-4 w-4" />
            </Link>
            <Link
              to="/debt-emi"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              <span>Track in Debt & EMI Dashboard</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
