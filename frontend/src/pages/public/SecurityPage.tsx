import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  AlertOctagon,
  KeyRound,
  FileCheck,
  ChevronDown,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Database,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const securityFaqs = [
    {
      q: 'How does FinSage handle my sensitive financial data?',
      a: 'FinSage is architected so that your personal transaction details and ledger records are stored within protected, authenticated user sessions. We do not sell or monetize your individual financial logs.',
    },
    {
      q: 'How are suspicious transactions identified in Scam Shield?',
      a: 'Scam Shield uses explainable rule-based heuristics and velocity anomaly detection. Instead of opaque black-box decisions, we clearly display why an alert was triggered—such as high transaction velocity, odd hour processing, or unverified merchant tags.',
    },
    {
      q: 'Can I export or delete my financial data at any time?',
      a: 'Yes. You have complete data control in your Settings panel. You can download an export of your transactions, reset mock data, or clear your session profile whenever you choose.',
    },
    {
      q: 'Does FinSage request my bank login credentials or passwords?',
      a: 'Never. FinSage operates solely on user-provided transaction logs and authenticated statements. We will never ask for your net banking passwords, UPI PINs, or debit card CVVs.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Privacy & Data Protection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            Your financial data deserves to be protected.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            FinSage is designed around privacy, secure access and transparent financial insights.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/scam-shield')}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-all hover:shadow"
            >
              <span>Explore Scam Shield</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <span>Manage Data Control</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5 Core Security Pillars */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Transparent security architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real privacy practices and explainable safeguards, designed for peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. DATA PRIVACY */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Data Privacy
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keep financial information handled with privacy in mind. Your transaction patterns and ledger logs belong solely to your account.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-teal-700">
              • Strict user session isolation
            </div>
          </div>

          {/* 2. SECURE AUTHENTICATION */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Secure Authentication
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use secure authentication and protected account access to ensure only verified owners can inspect portfolios and balances.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-indigo-700">
              • Protected tokenized sessions
            </div>
          </div>

          {/* 3. TRANSACTION PROTECTION */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Transaction Protection
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identify unusual transaction patterns and potential risks before fraudulent withdrawals or duplicate debits go unnoticed.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-rose-700">
              • Real-time velocity heuristics
            </div>
          </div>

          {/* 4. EXPLAINABLE ALERTS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 hover:border-teal-300 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Explainable Alerts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Understand why a transaction was flagged instead of receiving unexplained warnings. Every flag details merchant history, hour, and deviation.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-amber-700">
              • Clear rationale behind every alert
            </div>
          </div>

          {/* 5. DATA CONTROL */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 hover:border-teal-300 transition-colors md:col-span-2 lg:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Data Control
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manage your profile, preferences and financial data from one place. Export raw transaction sheets, customize categories, or wipe mock datasets at the click of a button.
            </p>
            <div className="flex gap-4 pt-2 text-[11px] font-semibold text-teal-700">
              <span>• Full JSON / CSV export</span>
              <span>• Complete data deletion anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Practices FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            <span>Security Practices & Transparency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Frequently asked questions about security
          </h2>
        </div>

        <div className="space-y-3">
          {securityFaqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4',
                      isOpen && 'rotate-180 text-teal-700'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white space-y-6 relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Test your security score on Scam Shield
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Scan mock and live transactions for high-risk anomalies and configure safety limits.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/scam-shield')}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow hover:bg-teal-500 transition-all hover:scale-105"
              >
                <span>Launch Scam Shield</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
