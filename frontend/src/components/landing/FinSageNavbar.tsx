import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-[#F8FAFA]/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50/90 text-teal-700 border border-teal-200/60 shadow-xs transition-all group-hover:bg-teal-100 group-hover:scale-105 group-hover:border-teal-300">
            <Leaf className="h-6 w-6 transform -rotate-12 fill-teal-600/20 text-teal-700 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              FinSage
            </div>
            <div className="text-[11px] font-medium text-slate-400 tracking-tight mt-0.5">
              Smarter Money. Brighter Tomorrow.
            </div>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-teal-800 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right: Auth & CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/signin')}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all hover:shadow"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile menu hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-5 md:hidden space-y-4 shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-teal-800 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/signin');
              }}
              className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Sign in
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
