import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Target,
  Landmark,
  ShieldAlert,
  Activity,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Clock,
  PieChart,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>FinSage Feature Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            Everything you need to understand your money.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            FinSage brings your spending, savings, debt, goals and financial health together in one clear experience.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-all hover:shadow hover:scale-102"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <span>View Free Plan</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* 1. TRACK YOUR MONEY */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 uppercase tracking-wider">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Track Your Money</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Know where your money goes.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track transactions, categorize spending and understand your financial patterns with granular accuracy and live categorization.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Real-time transaction logging across UPI, cards and accounts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Dynamic spending category breakdowns & recurring bills detection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Zero guesswork with customizable budget thresholds</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/transactions"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 group"
              >
                <span>Open Transactions ledger</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-900/5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-800">Recent Spending Pulse</span>
                <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Live Sync</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">🍔</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Food & Dining</div>
                      <div className="text-[10px] text-slate-400">Swiggy • Today, 1:20 PM</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">-₹420</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">⚡</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Utilities</div>
                      <div className="text-[10px] text-slate-400">Electricity Bill • Auto-pay</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">-₹1,850</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">💼</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Monthly Salary</div>
                      <div className="text-[10px] text-slate-400">Direct Deposit • Bank Transfer</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">+₹95,000</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PLAN YOUR FUTURE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800 uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>Plan Your Future</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Turn financial goals into a plan.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Create goals, simulate future scenarios and understand what it takes to reach them with interactive compounding models.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Multi-goal milestones (Emergency fund, Home down payment, Retirement)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Future Self simulation for 5, 10, 20 and 30-year horizons</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Scenario testing: see how ₹5,000 extra monthly savings accelerates freedom</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/future-self"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 group"
              >
                <span>Launch Future Self simulator</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 lg:order-1">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-900/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Target: Emergency Buffer</div>
                  <div className="text-[11px] text-slate-400">6 Months expenses target</div>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                  75% Achieved
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400">Saved so far</div>
                  <div className="font-bold text-slate-900 text-sm">₹1,80,000</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400">Target Amount</div>
                  <div className="font-bold text-slate-900 text-sm">₹2,40,000</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MANAGE YOUR DEBT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <Landmark className="h-3.5 w-3.5" />
              <span>Manage Your Debt</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Make debt easier to understand.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Analyse EMIs, repayment timelines, interest and different payment scenarios without complicated spreadsheets.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Debt-to-Income (DTI) ratio health gauge</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Prepayment impact calculation: shave years off home & car loans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Interest vs principal breakdown per installment</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/debt-emi"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-900 group"
              >
                <span>Calculate loan impact</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-900/5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Home Loan Optimization</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Save ₹3.2L Interest</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-400">Principal</div>
                  <div className="font-bold text-slate-800">₹35,00,000</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-400">Monthly EMI</div>
                  <div className="font-bold text-slate-800">₹32,450</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50">
                  <div className="text-[10px] text-slate-400">Tenure</div>
                  <div className="font-bold text-slate-800">15 Years</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs text-teal-900">
                💡 <strong>Prepayment Recommendation:</strong> Paying ₹3,000 extra per month reduces tenure by 28 months.
              </div>
            </div>
          </div>
        </section>

        {/* 4. PROTECT YOUR MONEY */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Protect Your Money</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Spot unusual transactions early.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scam Shield identifies unusual transaction patterns and explains why a transaction was flagged so you never face silent account drain.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Explainable anomaly detection (velocity spikes, odd midnight merchants)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Phishing URL scanner & suspicious UPI handle verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Actionable 1-click dispute guides & emergency helpline directory</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/scam-shield"
                className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 hover:text-rose-900 group"
              >
                <span>View Scam Shield Radar</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 lg:order-1">
            <div className="rounded-2xl border border-rose-200/80 bg-white p-6 shadow-lg shadow-rose-900/5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-900">Flagged Anomaly Alert</span>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">High Risk</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                <div className="font-bold text-slate-900">₹14,999 to "Quick-Crypto-Payout"</div>
                <div className="text-[11px] text-slate-600">
                  <strong>Why flagged:</strong> 3 consecutive fast transfers to an unverified beneficiary outside normal hours.
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">
                  Block Merchant
                </button>
                <button className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
                  Mark as Safe
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. UNDERSTAND YOUR FINANCES */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5" />
              <span>Understand Your Finances</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              See your financial health clearly.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get a transparent financial health score based on measurable financial indicators like savings rate, emergency runway, and debt burden.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Dynamic 0–100 composite Financial Health Index</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Key drivers: Savings ratio, liquidity buffer, debt load, investment stability</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Personalized checklist of steps to elevate your financial health tier</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/financial-health"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 group"
              >
                <span>Check your Health Index</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-900/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Financial Health Score</div>
                  <div className="text-[11px] text-slate-400">Based on 4 audited parameters</div>
                </div>
                <div className="text-2xl font-black text-teal-700">82<span className="text-xs font-normal text-slate-400">/100</span></div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Emergency Runway</span>
                  <span className="font-bold text-teal-700">4.5 Months (Good)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Savings Rate</span>
                  <span className="font-bold text-teal-700">28% (Optimal)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Debt-to-Income</span>
                  <span className="font-bold text-emerald-700">22% (Healthy)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. AI FINANCIAL INSIGHTS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Financial Insights</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Turn financial data into useful insights.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              AI explains your financial patterns and highlights areas that may need attention without complex jargon.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Executive Monthly Health & Cashflow Briefings</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Automated detection of lifestyle creep & unused subscriptions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Tax saving & government scheme eligibility recommendations</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/ai-report"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 group"
              >
                <span>Read sample AI Report</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 lg:order-1">
            <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-900 to-slate-900 text-white p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span>FinSage AI Synthesis</span>
              </div>
              <p className="text-xs text-teal-100 leading-relaxed">
                "Your dining expenditure increased by 18% this month (₹4,200), primarily on weekend deliveries. Diverting half of this into your emergency fund puts you on track to hit your goal 45 days earlier."
              </p>
              <div className="flex items-center justify-between text-[11px] text-teal-300/80 pt-2 border-t border-teal-700/50">
                <span>Confidence: 96%</span>
                <span className="font-semibold text-teal-200">Actionable step available</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10">
        <div className="rounded-3xl bg-teal-800 p-8 sm:p-12 text-center text-white space-y-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Start experiencing smarter money management today.
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl mx-auto">
              No credit card required. Explore our full suite of personal finance tools directly.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-xs sm:text-sm font-bold text-teal-900 shadow hover:bg-teal-50 transition-all hover:scale-105"
              >
                <span>Launch FinSage Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
