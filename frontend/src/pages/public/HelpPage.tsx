import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  BookOpen,
  CreditCard,
  Target,
  Wallet,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const helpTopics = [
    {
      category: 'Getting Started',
      icon: BookOpen,
      desc: 'Account setup, quickstart onboarding walkthrough, and understanding the main dashboard.',
      link: '/dashboard',
      articles: [
        'How to navigate the FinSage overview screen',
        'Understanding your net worth and cashflow telemetry',
        'Exporting and backing up your local financial data',
      ],
    },
    {
      category: 'Transactions & Accounts',
      icon: CreditCard,
      desc: 'Logging income, categorizing expenses, CSV statement import, and merchant tagging.',
      link: '/transactions',
      articles: [
        'Adding a manual transaction with tags',
        'Managing recurring bills and subscriptions',
        'Filtering transactions by category and date range',
      ],
    },
    {
      category: 'Goals & Future Self',
      icon: Target,
      desc: 'Setting milestone targets, calculating monthly contributions, and simulating compounding scenarios.',
      link: '/goals',
      articles: [
        'Creating an Emergency Buffer goal',
        'Running 10-year wealth simulations',
        'Adjusting expected inflation and rate of return',
      ],
    },
    {
      category: 'Budgets & Expense Caps',
      icon: Wallet,
      desc: 'Setting monthly category spending limits and receiving velocity breach warnings.',
      link: '/budgets',
      articles: [
        'Configuring 50/30/20 category limits',
        'What happens when a budget cap is exceeded?',
        'Resetting budget cycles at month-end',
      ],
    },
    {
      category: 'Security & Scam Shield',
      icon: ShieldCheck,
      desc: 'Suspicious transaction heuristic alerts, anomaly logs, and private session control.',
      link: '/scam-shield',
      articles: [
        'Why was a transaction flagged as high risk?',
        'Verifying suspicious UPI IDs and merchant tags',
        'How session data and credentials are kept safe',
      ],
    },
    {
      category: 'AI Insights & Reports',
      icon: Sparkles,
      desc: 'Understanding automated monthly health briefings and personalized improvement advice.',
      link: '/ai-report',
      articles: [
        'How the AI synthesizes monthly spending trends',
        'Understanding Financial Health score calculations',
        'Acting on AI debt reduction recommendations',
      ],
    },
  ];

  const filteredTopics = helpTopics.filter(
    (topic) =>
      topic.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.articles.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800">
            <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>Support & Documentation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            FinSage Help Center
          </h1>

          <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Find setup guides, step-by-step feature walkthroughs, and answers to common financial management questions.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search topics (e.g. goals, transactions, scam shield)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-teal-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Topics */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{topic.category}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{topic.desc}</p>

                  <div className="pt-2 space-y-1.5 border-t border-slate-100">
                    {topic.articles.map((art, aIdx) => (
                      <div
                        key={aIdx}
                        className="text-[11px] text-slate-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        onClick={() => navigate(topic.link)}
                      >
                        <span className="text-teal-600">•</span>
                        <span className="line-clamp-1">{art}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={topic.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 group"
                  >
                    <span>Open {topic.category}</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Still need help CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Still have questions or feedback?</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Our support team is happy to assist with any technical or platform questions.
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
