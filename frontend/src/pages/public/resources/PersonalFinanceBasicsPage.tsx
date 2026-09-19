import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  PieChart,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const PersonalFinanceBasicsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <BookOpen className="h-3.5 w-3.5 text-teal-600" />
            <span>Personal Finance Masterclass</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Personal Finance Basics: The Complete Blueprint
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Mastering personal finance doesn't require an economics degree. It begins with simple, repeatable habits: tracking cash flow, maintaining safety buffers, and compounding disciplined investments.
          </p>
        </div>
      </section>

      {/* Guide Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-700 text-xs sm:text-sm leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            1. The 50/30/20 Rule of Cashflow
          </h2>
          <p>
            The easiest framework to organize your post-tax monthly income is the 50/30/20 budget framework. It ensures your core survival needs are met while guaranteeing automated wealth creation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="text-xs font-bold text-teal-700">50% Needs</div>
              <div className="text-[11px] text-slate-500">Rent, groceries, utility bills, insurance, minimum loan EMIs.</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="text-xs font-bold text-indigo-700">30% Wants</div>
              <div className="text-[11px] text-slate-500">Dining out, travel, OTT subscriptions, weekend hobbies, shopping.</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="text-xs font-bold text-emerald-700">20% Savings & Debt</div>
              <div className="text-[11px] text-slate-500">Emergency fund contributions, index funds, accelerated loan payoff.</div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            2. The Hierarchy of Financial Security
          </h2>
          <p>
            Before allocating capital to speculative assets or high-risk equities, your financial foundation must be fortified in this exact sequence:
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 text-xs">Step 1: Term Life & Health Insurance:</strong> Protect against catastrophic medical emergencies that can wipe out decades of savings.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 text-xs">Step 2: Emergency Runway:</strong> 3 to 6 months of mandatory household expenses parked in liquid instruments.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 text-xs">Step 3: Eliminate Toxic Debt:</strong> Wipe out credit card roll-overs (36–42% interest) and personal loans immediately.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 text-xs">Step 4: Long-Term Compounding:</strong> Systematic index funds, equity SIPs, and retirement accounts.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            3. Automated Tracking with FinSage
          </h2>
          <p>
            The hardest part of personal finance is consistency. FinSage removes manual friction by automatically structuring your cashflow, alerting you to spending velocity spikes, and calculating your real-time Financial Health index.
          </p>
        </section>

        {/* Action Card */}
        <div className="rounded-2xl bg-teal-800 p-6 sm:p-8 text-white space-y-4">
          <h3 className="text-lg font-bold">Put theory into practice</h3>
          <p className="text-xs text-teal-100 max-w-xl">
            Log your income and expenses in the FinSage dashboard to get an automated 50/30/20 breakdown and instant health diagnosis.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-teal-900 shadow hover:bg-teal-50"
          >
            <span>Open FinSage Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
