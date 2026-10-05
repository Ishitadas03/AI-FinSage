import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '@/components/landing/PublicNavbar';
import { PublicFooter } from '@/components/landing/PublicFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { ValuePropositionSection } from '@/components/landing/ValuePropositionSection';
import {
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { setIsOnboardingOpen } = useFinance();

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-slate-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Mega-Menu Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Three Column Value Proposition Section */}
      <ValuePropositionSection />

      {/* Interactive Teaser Banner */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 py-16 text-white relative overflow-hidden">
        {/* Soft background ambient glow */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-teal-200 backdrop-blur-xs border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            <span>Ready to see your future?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Take control of your money today.<br />
            Your future self will thank you.
          </h2>

          <p className="mx-auto max-w-xl text-xs sm:text-sm text-teal-100/90 leading-relaxed">
            Join thousands of users building resilient emergency buffers, optimizing loan EMIs, and navigating their path to early financial freedom.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-xs sm:text-sm font-bold text-teal-950 shadow-md hover:bg-teal-50 transition-colors"
            >
              <span>Launch FinSage App</span>
              <ArrowRight className="h-4 w-4 text-teal-800" />
            </button>
            <button
              onClick={() => navigate('/future-self')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-xs"
            >
              <span>Try Future Self Simulator</span>
            </button>
          </div>
        </div>
      </section>

      {/* Comprehensive Public Footer */}
      <PublicFooter />
    </div>
  );
};
