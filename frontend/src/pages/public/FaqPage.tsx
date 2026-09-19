import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Calculator,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FaqPage: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<string | null>('general-0');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqData = [
    {
      category: 'General',
      id: 'general-0',
      q: 'What is FinSage?',
      a: 'FinSage is an all-in-one personal finance and wealth intelligence platform that unifies your transaction tracking, spending analytics, loan management, future wealth simulations, and financial health scoring into one clear interface.',
    },
    {
      category: 'General',
      id: 'general-1',
      q: 'Is FinSage free to use?',
      a: 'Yes. FinSage offers a robust Free tier (₹0) that provides complete transaction logging, spending analysis, basic goals, and core financial health scores without requiring a credit card.',
    },
    {
      category: 'Security & Privacy',
      id: 'sec-0',
      q: 'How does FinSage protect my financial privacy?',
      a: 'FinSage is engineered with strict user session isolation. We do not sell or monetize personal financial ledgers. Furthermore, users can export or wipe their data at any time in Settings.',
    },
    {
      category: 'Security & Privacy',
      id: 'sec-1',
      q: 'Does FinSage connect to my bank passwords?',
      a: 'No. FinSage will never ask for your net banking passwords, ATM PINs, or card CVVs. The application functions entirely through user-managed statements, transactions, and secure sessions.',
    },
    {
      category: 'Features & AI',
      id: 'feat-0',
      q: 'How does the Financial Health Score work?',
      a: 'Our Financial Health index computes a 0–100 score based on four measurable parameters: Liquidity Runway (months of expenses), Savings Rate, Debt-to-Income (DTI) ratio, and Investment Growth consistency.',
    },
    {
      category: 'Features & AI',
      id: 'feat-1',
      q: 'What is the Scam Shield feature?',
      a: 'Scam Shield evaluates transaction velocity, unverified merchant IDs, and odd hour transfers to highlight suspicious anomalies. Every flag is fully explainable so you understand exactly why an alert was triggered.',
    },
    {
      category: 'Calculators & Planning',
      id: 'calc-0',
      q: 'Are the financial calculators mathematically accurate?',
      a: 'Yes. All FinSage calculators (EMI, Savings Growth, Compound Interest, and Goal Planners) utilize verified financial compounding and reducing balance formulas.',
    },
    {
      category: 'Calculators & Planning',
      id: 'calc-1',
      q: 'What is the Future Self simulation?',
      a: 'The Future Self engine projects your portfolio trajectory over 5 to 30 years, factoring in expected inflation and incremental monthly SIP increases to show when you can achieve financial independence.',
    },
  ];

  const filteredFaqs =
    activeCategory === 'all'
      ? faqData
      : faqData.filter((item) => item.category.toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>Questions & Answers</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Everything you need to know about FinSage features, privacy practices, calculations, and account capabilities.
          </p>
        </div>
      </section>

      {/* Category Pills & FAQ Accordions */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['all', 'General', 'Security & Privacy', 'Features & AI', 'Calculators & Planning'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-semibold border transition-all',
                  activeCategory === cat
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                {cat === 'all' ? 'All Questions' : cat}
              </button>
            )
          )}
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openIndex === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {faq.category}
                    </span>
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4',
                      isOpen && 'rotate-180 text-teal-700'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Banner */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Have a question not listed here?</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Send us a direct message and our team will get back to you promptly.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shrink-0"
          >
            <span>Ask a Question</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
