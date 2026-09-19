import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Leaf,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  CreditCard,
  PieChart,
  Wallet,
  Target,
  Clock,
  Landmark,
  Activity,
  FileText,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Calculator,
  HelpCircle,
  MessageSquare,
  Sparkles,
  DollarSign,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/context/FinanceContext';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsOnboardingOpen } = useFinance();

  const [activeDropdown, setActiveDropdown] = useState<'product' | 'resources' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: 'product' | 'resources') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Active link check
  const isProductActive = [
    '/dashboard',
    '/transactions',
    '/spending',
    '/budgets',
    '/goals',
    '/future-self',
    '/debt-emi',
    '/financial-health',
    '/ai-report',
    '/market-intel',
    '/scam-shield',
  ].some((path) => location.pathname === path);

  const isResourcesActive =
    location.pathname.startsWith('/resources') ||
    location.pathname.startsWith('/tools') ||
    ['/help', '/faq', '/contact'].includes(location.pathname);

  const isFeaturesActive = location.pathname === '/features';
  const isSecurityActive = location.pathname === '/security';
  const isPricingActive = location.pathname === '/pricing';
  const isAboutActive = location.pathname === '/about';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-[#F8FAFA]/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs transition-all group-hover:bg-teal-100 group-hover:scale-105">
            <Leaf className="h-5 w-5 transform -rotate-12 fill-teal-600/20" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              FinSage
            </div>
            <div className="text-[10px] font-medium text-slate-400 tracking-tight mt-0.5">
              Smarter Money. Brighter Tomorrow.
            </div>
          </div>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
          
          {/* 1. PRODUCT Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('product')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'product' ? null : 'product')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:text-teal-800 hover:bg-slate-100/60',
                (isProductActive || activeDropdown === 'product') && 'text-teal-800 font-bold bg-teal-50/70'
              )}
            >
              <span>Product</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200 text-slate-400',
                  activeDropdown === 'product' && 'rotate-180 text-teal-700'
                )}
              />
            </button>

            {/* Product Mega Menu Dropdown */}
            {activeDropdown === 'product' && (
              <div className="absolute left-1/2 -translate-x-1/3 top-full mt-2 w-[740px] rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/8 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="grid grid-cols-2 gap-6">
                  {/* Category 1: Money Management */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5">
                      Money Management
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/transactions"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Transactions
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Track income, expenses and transactions in one place.
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/spending"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <PieChart className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Spending Analytics
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Understand where your money goes.
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/budgets"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Budgets
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Set spending limits and stay on track.
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Category 2: Financial Planning */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5">
                      Financial Planning
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/goals"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <Target className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Goals
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Create and track meaningful financial goals.
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/future-self"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Future Self
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Simulate your financial future.
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/debt-emi"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Debt & EMI
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Understand loans, EMIs and repayment impact.
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Category 3: Intelligence */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5">
                      Intelligence
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/financial-health"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Financial Health
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Understand your overall financial position.
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/ai-report"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            AI Financial Report
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Turn financial data into clear insights.
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/market-intel"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                            Market Intel
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Monitor portfolio and market information.
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Category 4: Protection */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5">
                      Protection
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/scam-shield"
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-rose-900">
                            Scam Shield
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Identify unusual and suspicious transactions.
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="pt-3">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-700">
                          Complete FinTech Suite
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Experience an all-in-one financial intelligence system.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Explore FinSage */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between px-2 text-xs">
                  <div className="text-slate-500 text-[11px]">
                    Ready to take charge of your finances?
                  </div>
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-900"
                  >
                    <span>Explore FinSage</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. FEATURES Direct Link */}
          <Link
            to="/features"
            className={cn(
              'rounded-lg px-3 py-2 transition-colors hover:text-teal-800 hover:bg-slate-100/60',
              isFeaturesActive && 'text-teal-800 font-bold bg-teal-50/70'
            )}
          >
            Features
          </Link>

          {/* 3. SECURITY Direct Link */}
          <Link
            to="/security"
            className={cn(
              'rounded-lg px-3 py-2 transition-colors hover:text-teal-800 hover:bg-slate-100/60',
              isSecurityActive && 'text-teal-800 font-bold bg-teal-50/70'
            )}
          >
            Security
          </Link>

          {/* 4. PRICING Direct Link */}
          <Link
            to="/pricing"
            className={cn(
              'rounded-lg px-3 py-2 transition-colors hover:text-teal-800 hover:bg-slate-100/60',
              isPricingActive && 'text-teal-800 font-bold bg-teal-50/70'
            )}
          >
            Pricing
          </Link>

          {/* 5. ABOUT Direct Link */}
          <Link
            to="/about"
            className={cn(
              'rounded-lg px-3 py-2 transition-colors hover:text-teal-800 hover:bg-slate-100/60',
              isAboutActive && 'text-teal-800 font-bold bg-teal-50/70'
            )}
          >
            About
          </Link>

          {/* 6. RESOURCES Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('resources')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:text-teal-800 hover:bg-slate-100/60',
                (isResourcesActive || activeDropdown === 'resources') &&
                  'text-teal-800 font-bold bg-teal-50/70'
              )}
            >
              <span>Resources</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200 text-slate-400',
                  activeDropdown === 'resources' && 'rotate-180 text-teal-700'
                )}
              />
            </button>

            {/* Resources Dropdown Popover */}
            {activeDropdown === 'resources' && (
              <div className="absolute right-0 top-full mt-2 w-[680px] rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/8 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="grid grid-cols-3 gap-6">
                  
                  {/* LEARN */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      <BookOpen className="h-3 w-3 text-teal-600" />
                      <span>Learn</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <Link
                        to="/resources/personal-finance-basics"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Personal Finance Basics
                      </Link>
                      <Link
                        to="/resources/budgeting"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Budgeting Guide
                      </Link>
                      <Link
                        to="/resources/emi-guide"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Understanding EMI
                      </Link>
                      <Link
                        to="/resources/emergency-fund"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Emergency Fund Guide
                      </Link>
                      <Link
                        to="/resources/financial-health"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Financial Health Guide
                      </Link>
                    </div>
                  </div>

                  {/* TOOLS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      <Calculator className="h-3 w-3 text-teal-600" />
                      <span>Tools</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <Link
                        to="/tools/emi-calculator"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        EMI Calculator
                      </Link>
                      <Link
                        to="/tools/savings-calculator"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Savings Calculator
                      </Link>
                      <Link
                        to="/tools/compound-interest"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Compound Interest
                      </Link>
                      <Link
                        to="/tools/goal-calculator"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Goal Calculator
                      </Link>
                    </div>
                  </div>

                  {/* SUPPORT */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      <HelpCircle className="h-3 w-3 text-teal-600" />
                      <span>Support</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <Link
                        to="/help"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Help Center
                      </Link>
                      <Link
                        to="/faq"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        FAQ
                      </Link>
                      <Link
                        to="/contact"
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-teal-50/60 hover:text-teal-900 transition-colors"
                      >
                        Contact Support
                      </Link>
                    </div>

                    <div className="pt-2">
                      <div className="rounded-xl bg-teal-50/80 p-2.5 border border-teal-100 text-[10px] text-teal-900 font-medium">
                        💡 Need instant advice? Try our AI Financial Report.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </nav>

        {/* Right: Auth & CTA Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              navigate('/dashboard');
            }}
            className="group flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all hover:shadow"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile menu hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-5 lg:hidden space-y-4 shadow-lg animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            
            {/* Product Accordion on Mobile */}
            <div>
              <button
                onClick={() => setMobileProductOpen(!mobileProductOpen)}
                className="flex w-full items-center justify-between py-2 text-left hover:text-teal-800 transition-colors"
              >
                <span>Product</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform text-slate-400',
                    mobileProductOpen && 'rotate-180 text-teal-700'
                  )}
                />
              </button>

              {mobileProductOpen && (
                <div className="pl-3 py-2 space-y-2 text-xs border-l-2 border-teal-500 bg-slate-50/50 rounded-r-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-1">Money Management</div>
                  <Link to="/transactions" className="block py-1 hover:text-teal-800">Transactions</Link>
                  <Link to="/spending" className="block py-1 hover:text-teal-800">Spending Analytics</Link>
                  <Link to="/budgets" className="block py-1 hover:text-teal-800">Budgets</Link>

                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-2">Financial Planning</div>
                  <Link to="/goals" className="block py-1 hover:text-teal-800">Goals</Link>
                  <Link to="/future-self" className="block py-1 hover:text-teal-800">Future Self</Link>
                  <Link to="/debt-emi" className="block py-1 hover:text-teal-800">Debt & EMI</Link>

                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-2">Intelligence</div>
                  <Link to="/financial-health" className="block py-1 hover:text-teal-800">Financial Health</Link>
                  <Link to="/ai-report" className="block py-1 hover:text-teal-800">AI Financial Report</Link>
                  <Link to="/market-intel" className="block py-1 hover:text-teal-800">Market Intel</Link>

                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-2">Protection</div>
                  <Link to="/scam-shield" className="block py-1 text-rose-700 hover:text-rose-900">Scam Shield</Link>
                </div>
              )}
            </div>

            {/* Features */}
            <Link
              to="/features"
              className={cn(
                'py-2 hover:text-teal-800 transition-colors',
                isFeaturesActive && 'text-teal-800 font-bold'
              )}
            >
              Features
            </Link>

            {/* Security */}
            <Link
              to="/security"
              className={cn(
                'py-2 hover:text-teal-800 transition-colors',
                isSecurityActive && 'text-teal-800 font-bold'
              )}
            >
              Security
            </Link>

            {/* Pricing */}
            <Link
              to="/pricing"
              className={cn(
                'py-2 hover:text-teal-800 transition-colors',
                isPricingActive && 'text-teal-800 font-bold'
              )}
            >
              Pricing
            </Link>

            {/* About */}
            <Link
              to="/about"
              className={cn(
                'py-2 hover:text-teal-800 transition-colors',
                isAboutActive && 'text-teal-800 font-bold'
              )}
            >
              About
            </Link>

            {/* Resources Accordion on Mobile */}
            <div>
              <button
                onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                className="flex w-full items-center justify-between py-2 text-left hover:text-teal-800 transition-colors"
              >
                <span>Resources</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform text-slate-400',
                    mobileResourcesOpen && 'rotate-180 text-teal-700'
                  )}
                />
              </button>

              {mobileResourcesOpen && (
                <div className="pl-3 py-2 space-y-2 text-xs border-l-2 border-teal-500 bg-slate-50/50 rounded-r-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-1">Learn Guides</div>
                  <Link to="/resources/personal-finance-basics" className="block py-1 hover:text-teal-800">Personal Finance Basics</Link>
                  <Link to="/resources/budgeting" className="block py-1 hover:text-teal-800">Budgeting Guide</Link>
                  <Link to="/resources/emi-guide" className="block py-1 hover:text-teal-800">Understanding EMI</Link>
                  <Link to="/resources/emergency-fund" className="block py-1 hover:text-teal-800">Emergency Fund Guide</Link>
                  <Link to="/resources/financial-health" className="block py-1 hover:text-teal-800">Financial Health Guide</Link>

                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-2">Calculators</div>
                  <Link to="/tools/emi-calculator" className="block py-1 hover:text-teal-800">EMI Calculator</Link>
                  <Link to="/tools/savings-calculator" className="block py-1 hover:text-teal-800">Savings Calculator</Link>
                  <Link to="/tools/compound-interest" className="block py-1 hover:text-teal-800">Compound Interest</Link>
                  <Link to="/tools/goal-calculator" className="block py-1 hover:text-teal-800">Goal Calculator</Link>

                  <div className="text-[10px] uppercase font-bold text-slate-400 pt-2">Support</div>
                  <Link to="/help" className="block py-1 hover:text-teal-800">Help Center</Link>
                  <Link to="/faq" className="block py-1 hover:text-teal-800">FAQ</Link>
                  <Link to="/contact" className="block py-1 hover:text-teal-800">Contact Support</Link>
                </div>
              )}
            </div>

          </nav>

          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
