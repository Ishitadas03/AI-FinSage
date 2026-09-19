import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  HelpCircle,
  Clock,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setWaitlistSubmitted(true);
    toast.success("You're on the FinSage Pro waitlist! We'll notify you when early access opens.");
    setTimeout(() => {
      setIsWaitlistModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-teal-50/20 to-[#F8FAFA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>Transparent Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            Start understanding your money today.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Choose the plan that fits your financial journey. Get started completely free with core tracking and intelligence tools.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* FREE TIER */}
          <div className="rounded-3xl border-2 border-teal-600 bg-white p-8 shadow-xl shadow-teal-900/5 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-8 rounded-full bg-teal-700 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
              Popular & Free
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Free</h3>
                <p className="text-xs text-slate-500 mt-1">For individuals getting started.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">₹0</span>
                <span className="text-xs font-medium text-slate-400">/ forever</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-800">What's included:</div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Transaction tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Spending analytics & category breakdowns</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Financial health scoring</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Basic financial goals tracker</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Basic AI insights & monthly brief</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-teal-800 transition-all hover:scale-102"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* PRO TIER */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 shadow-xs flex flex-col justify-between relative">
            <div className="absolute -top-3.5 right-8 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>Coming Soon</span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pro</h3>
                <p className="text-xs text-slate-500 mt-1">For advanced wealth builders and power users.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">Coming Soon</span>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800">Everything in Free, plus:</div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Advanced AI insights & personalized advice</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Advanced comprehensive financial reports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Future Self deep simulations & market shocks</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Advanced portfolio analytics & rebalancing</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>Additional automation & smart rules</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setIsWaitlistModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3.5 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-100 transition-all hover:scale-102"
              >
                <span>Join Waitlist</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Waitlist Modal */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Join FinSage Pro Waitlist</h3>
              </div>
              <button
                onClick={() => setIsWaitlistModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Be the first to access our upcoming Pro intelligence features, predictive wealth simulation models, and priority support.
            </p>

            <form onSubmit={handleJoinWaitlist} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Notify Me on Launch</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
