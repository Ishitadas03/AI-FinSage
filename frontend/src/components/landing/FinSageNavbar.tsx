import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';
import { FinSageLogo } from '@/components/brand/FinSageLogo';

export const FinSageNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { setIsOnboardingOpen } = useFinance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Product', href: '#features' },
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '/scam-shield' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '/financial-health' },
    { name: 'Resources', href: '/help-support' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-[#F8FAFA]/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center group shrink-0 py-1">
          <FinSageLogo variant="horizontal" height={42} />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 xl:gap-9 text-[15px] font-medium text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="py-2 hover:text-teal-700 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right: Auth & CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3.5 shrink-0">
          <button
            onClick={() => navigate('/signin')}
            className="rounded-xl px-4 py-2.5 text-[15px] font-medium text-slate-700 hover:text-teal-800 hover:bg-slate-100/70 transition-colors whitespace-nowrap"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 sm:px-6 text-[15px] font-semibold text-white shadow-xs hover:bg-teal-800 transition-all hover:shadow-sm whitespace-nowrap shrink-0"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </button>
        </div>

        {/* Mobile menu hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-5 py-6 md:hidden space-y-5 shadow-xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-[15px] font-semibold text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-teal-700 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/signin');
              }}
              className="w-full h-11 rounded-xl border border-slate-200 py-2.5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-full h-11 rounded-xl bg-teal-700 py-2.5 text-[15px] font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
