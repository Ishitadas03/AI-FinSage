import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  Compass,
  Eye,
  ShieldCheck,
  TrendingUp,
  ArrowDown,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  LineChart,
  Target,
  Smile,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const workflowSteps = [
    {
      title: 'Your financial data',
      desc: 'Transactions, savings, income sources and recurring commitments.',
      icon: Database,
    },
    {
      title: 'Financial analysis',
      desc: 'Algorithmic debt modeling, liquidity runway, and spending velocity checks.',
      icon: LineChart,
    },
    {
      title: 'Clear visual insights',
      desc: 'Transparent Financial Health scoring without opaque black boxes.',
      icon: Eye,
    },
    {
      title: 'Planning tools',
      desc: 'Future Self compounding simulations, budget limits, and EMI optimization.',
      icon: Target,
    },
    {
      title: 'Better financial awareness',
      desc: 'Confident decisions backed by verifiable data.',
      icon: Smile,
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800 shadow-2xs">
            <Leaf className="h-3.5 w-3.5 text-teal-600" />
            <span>About FinSage</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            Financial clarity, without the complexity.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            FinSage is designed to make personal finance easier to understand. It brings spending, savings, debt, goals and financial health into one clear experience.
          </p>

          <div className="pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-all hover:shadow"
            >
              <span>Explore the Platform</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Principles */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Our Guiding Principles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Every feature we design adheres to four foundational values.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* 1. CLARITY */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs space-y-3 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clarity</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Complex financial information should be easy to understand. We replace intimidating spreadsheets and jargon with intuitive visual telemetry and structured summaries.
            </p>
          </div>

          {/* 2. TRANSPARENCY */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs space-y-3 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Transparency</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Users should understand where financial insights come from. We always display the underlying data points, formulas, and rationale behind health ratings and alerts.
            </p>
          </div>

          {/* 3. PRIVACY */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs space-y-3 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Privacy</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Financial information deserves careful handling. We treat user data with the highest discretion, isolation, and user-controlled export or wipe capabilities.
            </p>
          </div>

          {/* 4. ACTIONABLE INSIGHTS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs space-y-3 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Actionable Insights</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Financial information is most useful when it helps users plan their next step. Rather than passive numbers, we provide tangible recommendations on emergency buffers and loan repayments.
            </p>
          </div>
        </div>
      </div>

      {/* How FinSage Works Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            How FinSage Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From raw numbers to actionable financial confidence.
          </p>
        </div>

        <div className="space-y-3 relative">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-teal-300 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 font-bold text-xs">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {idx + 1}. {step.title}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      {step.desc}
                    </div>
                  </div>
                </div>

                {idx < workflowSteps.length - 1 && (
                  <div className="my-1.5 flex items-center justify-center text-teal-600">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-teal-800 p-8 sm:p-12 text-center text-white space-y-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to see clarity in your own finances?
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl mx-auto">
              Get started with our free tools and experience how FinSage transforms your financial outlook.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-xs sm:text-sm font-bold text-teal-900 shadow hover:bg-teal-50 transition-all hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
