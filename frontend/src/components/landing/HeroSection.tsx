import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { HeroDashboardPreview } from './HeroDashboardPreview';
import { FloatingFeatureCard } from './FloatingFeatureCard';
import { TrustIndicators } from './TrustIndicators';
import { useFinance } from '@/context/FinanceContext';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { setIsOnboardingOpen } = useFinance();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const handleSeeHowItWorks = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#F8FAFA] pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Soft Mint/Teal Radial Glow & Geometric Curves */}
      <div className="absolute top-0 right-1/4 -z-10 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-teal-200/25 via-emerald-100/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-cyan-100/30 via-teal-100/15 to-transparent blur-3xl pointer-events-none" />

      {/* Subtle abstract curve lines */}
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-slate-200/40 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="hero-grid" width="48" height="48" x="50%" y="-1" patternUnits="userSpaceOnUse">
            <path d="M.5 48V.5H48" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#hero-grid)" />
      </svg>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT HERO CONTENT (5 cols on lg, 6 on xl) */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-6 text-left">
            {/* Pill/Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/80 px-3.5 py-1.5 text-xs font-bold text-teal-800 shadow-2xs backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
              <span className="tracking-wide uppercase text-[11px]">✦ AI-Powered Financial Clarity</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-[54px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Make every financial decision with{' '}
              <span className="text-teal-700 relative inline-block">
                clarity.
                <svg
                  className="absolute left-0 -bottom-1 w-full text-teal-300/60"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  height="6"
                >
                  <path d="M0 5 Q 50 0, 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              FinSage brings your spending, savings, debt, goals, and financial health together — so you can understand where you stand and plan where you're going.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={handleGetStarted}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-all hover:shadow-md active:scale-98"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleSeeHowItWorks}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all active:scale-98"
              >
                <Play className="h-3.5 w-3.5 fill-slate-500 text-slate-500" />
                <span>See How It Works</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <TrustIndicators />
          </div>

          {/* RIGHT PRODUCT PREVIEW & FLOATING CARDS (7 cols on lg, 7 on xl) */}
          <div className="lg:col-span-6 xl:col-span-7 relative pt-4 pb-6 lg:py-8">
            {/* Desktop Overlapping Floating Cards */}
            <div className="relative">
              
              {/* CARD 1: Top Left Floating Card */}
              <div className="hidden sm:block absolute -top-6 -left-6 z-20 animate-in fade-in zoom-in duration-500">
                <FloatingFeatureCard
                  iconType="target"
                  title="Build Goals"
                  description="Turn dreams into a plan."
                  iconBgColor="bg-teal-50"
                  iconColor="text-teal-700"
                  className="max-w-[210px]"
                />
              </div>

              {/* CARD 2: Top Right Floating Card */}
              <div className="hidden sm:block absolute -top-5 -right-4 z-20 animate-in fade-in zoom-in duration-700">
                <FloatingFeatureCard
                  iconType="sparkles"
                  title="Smarter Insights"
                  description="Get personalized AI insights."
                  iconBgColor="bg-amber-50"
                  iconColor="text-amber-600"
                  className="max-w-[220px]"
                />
              </div>

              {/* Main Interactive Product Preview */}
              <div className="relative z-10 mx-auto max-w-xl lg:max-w-none">
                <HeroDashboardPreview />
              </div>

              {/* CARD 3: Bottom Left Floating Card */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 z-20 animate-in fade-in zoom-in duration-700">
                <FloatingFeatureCard
                  iconType="chart"
                  title="Plan Your Future"
                  description="See where you could be in 5 or 10 years."
                  iconBgColor="bg-emerald-50"
                  iconColor="text-emerald-700"
                  className="max-w-[240px]"
                />
              </div>

              {/* CARD 4: Bottom Right Floating Card */}
              <div className="hidden sm:block absolute -bottom-5 -right-4 z-20 animate-in fade-in zoom-in duration-500">
                <FloatingFeatureCard
                  iconType="shield"
                  title="Stay Protected"
                  description="Detect suspicious transactions."
                  iconBgColor="bg-rose-50"
                  iconColor="text-rose-600"
                  className="max-w-[230px]"
                />
              </div>
            </div>

            {/* Mobile-Friendly Grid for Feature Cards on small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:hidden gap-2 mt-4">
              <FloatingFeatureCard
                iconType="target"
                title="Build Goals"
                description="Turn dreams into a plan."
              />
              <FloatingFeatureCard
                iconType="sparkles"
                title="Smarter Insights"
                description="Get personalized AI insights."
                iconBgColor="bg-amber-50"
                iconColor="text-amber-600"
              />
              <FloatingFeatureCard
                iconType="chart"
                title="Plan Your Future"
                description="See where you could be in 5 or 10 years."
                iconBgColor="bg-emerald-50"
                iconColor="text-emerald-700"
              />
              <FloatingFeatureCard
                iconType="shield"
                title="Stay Protected"
                description="Detect suspicious transactions."
                iconBgColor="bg-rose-50"
                iconColor="text-rose-600"
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
