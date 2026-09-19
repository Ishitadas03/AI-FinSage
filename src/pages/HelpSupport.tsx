import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  FileQuestion,
  ShieldCheck,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFinance } from '@/context/FinanceContext';

export const HelpSupport: React.FC = () => {
  const { setIsChatOpen } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<number | null>(0);

  // Ticket Form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Account & Banking');
  const [ticketMessage, setTicketMessage] = useState('');

  const faqs = [
    {
      id: 0,
      category: 'Security & Scam Shield',
      q: 'How does FinSage Scam Shield detect fraudulent transactions?',
      a: 'Scam Shield uses heuristic behavioral modeling and national cybercrime registry matching to inspect transaction velocity, IP geolocation discrepancies, atypical transaction sizes, and rogue recurring billing signatures. It never black-boxes detections—every flag provides transparent, explainable reasons.',
    },
    {
      id: 1,
      category: 'Goals & Future Self',
      q: 'How are Future Self inflation-adjusted figures calculated?',
      a: 'Future Self models compound wealth using monthly compounding on your initial corpus and recurring SIP additions (stepped up annually with your income growth). The "Real Value" is discounted using the compound inflation rate formula: Real = Nominal / (1 + inflation)^years.',
    },
    {
      id: 2,
      category: 'Banking & Aggregators',
      q: 'Is my banking login data stored on FinSage servers?',
      a: 'No. FinSage uses RBI/SEBI compliant Account Aggregator protocols with 256-bit asymmetric end-to-end encryption. FinSage only receives read-only anonymized transaction metadata with explicit user consent.',
    },
    {
      id: 3,
      category: 'General & AI Insights',
      q: 'Can the AI copilot give direct stock tips or speculative advice?',
      a: 'No. FinSage follows strict Responsible AI guidelines. It provides educational analysis, cash flow budgeting, and objective math calculations (such as loan prepayment interest savings) rather than speculative market advice.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error('Please enter a subject and message.');
      return;
    }
    toast.success('Support ticket #FS-94812 submitted. Our advisory team will respond within 4 hours.');
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-teal-700" />
          Help Center & Support Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Find instant answers to common financial questions or connect directly with our advisory specialists.
        </p>
      </div>

      {/* Search Header Hero */}
      <div className="card-fintech p-6 bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">How can we assist your financial journey?</h2>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs, Scam Shield guides, formula explanations..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* 3 Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setIsChatOpen(true)}
          className="card-fintech p-4 cursor-pointer hover:border-teal-600 transition-all text-center space-y-2 group"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-100">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Instant AI Copilot</h4>
          <p className="text-[11px] text-slate-500">24/7 instant grounded answers to your ledger questions.</p>
        </div>

        <div className="card-fintech p-4 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Mail className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Email Support Desk</h4>
          <p className="text-[11px] text-slate-500">support@finsage.io • Response within 4 hours.</p>
        </div>

        <div className="card-fintech p-4 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Security & Grievances</h4>
          <p className="text-[11px] text-slate-500">SEBI/RBI aligned grievance redressal officer.</p>
        </div>
      </div>

      {/* 2-Column: FAQs (7 cols) + Contact Form (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-7 card-fintech p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-teal-700" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden text-xs"
              >
                <button
                  onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                  className="flex w-full items-center justify-between p-3.5 text-left font-bold text-slate-900 hover:bg-slate-50"
                >
                  <span className="pr-2">{faq.q}</span>
                  {openFaqId === faq.id ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {openFaqId === faq.id && (
                  <div className="p-3.5 pt-0 text-slate-600 text-[11px] leading-relaxed border-t border-slate-100/60 bg-white">
                    <span className="inline-block text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded mb-1.5">
                      {faq.category}
                    </span>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Ticket Form */}
        <div className="lg:col-span-5 card-fintech p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-teal-700" />
            Submit a Support Ticket
          </h3>

          <form onSubmit={handleSubmitTicket} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                <option>Account & Banking Sync</option>
                <option>Scam Shield & Fraud Dispute</option>
                <option>Goal Simulation Formulas</option>
                <option>Feature Request</option>
                <option>Other Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your query..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Message Description</label>
              <textarea
                required
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
