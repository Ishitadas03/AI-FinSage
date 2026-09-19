import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Info (2 cols on md) */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs">
                <Leaf className="h-5 w-5 transform -rotate-12 fill-teal-600/20" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none block">
                  FinSage
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-tight">
                  Smarter Money. Brighter Tomorrow.
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              FinSage is an AI-powered financial platform that brings your spending, savings, debt, goals, and financial health together so you can make decisions with complete clarity.
            </p>

            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Grounded in actual ledger records • Private by design</span>
            </div>
          </div>

          {/* Col 1: PRODUCT */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="hover:text-teal-800 transition-colors">Dashboard</Link></li>
              <li><Link to="/transactions" className="hover:text-teal-800 transition-colors">Transactions</Link></li>
              <li><Link to="/spending" className="hover:text-teal-800 transition-colors">Spending Analytics</Link></li>
              <li><Link to="/budgets" className="hover:text-teal-800 transition-colors">Budgets</Link></li>
              <li><Link to="/goals" className="hover:text-teal-800 transition-colors">Goals</Link></li>
              <li><Link to="/future-self" className="hover:text-teal-800 transition-colors">Future Self</Link></li>
              <li><Link to="/debt-emi" className="hover:text-teal-800 transition-colors">Debt & EMI</Link></li>
              <li><Link to="/scam-shield" className="hover:text-teal-800 transition-colors">Scam Shield</Link></li>
            </ul>
          </div>

          {/* Col 2: COMPANY */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-teal-800 transition-colors">About Us</Link></li>
              <li><Link to="/features" className="hover:text-teal-800 transition-colors">Features</Link></li>
              <li><Link to="/security" className="hover:text-teal-800 transition-colors">Security & Trust</Link></li>
              <li><Link to="/pricing" className="hover:text-teal-800 transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-teal-800 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Col 3: RESOURCES & TOOLS */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Resources & Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/resources/personal-finance-basics" className="hover:text-teal-800 transition-colors">Finance Basics</Link></li>
              <li><Link to="/resources/budgeting" className="hover:text-teal-800 transition-colors">Budgeting Guide</Link></li>
              <li><Link to="/resources/emi-guide" className="hover:text-teal-800 transition-colors">EMI Guide</Link></li>
              <li><Link to="/resources/emergency-fund" className="hover:text-teal-800 transition-colors">Emergency Fund</Link></li>
              <li><Link to="/tools/emi-calculator" className="hover:text-teal-800 transition-colors">EMI Calculator</Link></li>
              <li><Link to="/tools/savings-calculator" className="hover:text-teal-800 transition-colors">Savings Calculator</Link></li>
              <li><Link to="/tools/compound-interest" className="hover:text-teal-800 transition-colors">Compound Interest</Link></li>
              <li><Link to="/faq" className="hover:text-teal-800 transition-colors">FAQ</Link></li>
              <li><Link to="/help" className="hover:text-teal-800 transition-colors">Help Center</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Legal & Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 FinSage. All rights reserved.</p>

          <div className="flex items-center gap-5">
            <Link to="/settings" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <Link to="/help" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <Link to="/security" className="hover:text-slate-600 transition-colors">Security Disclosure</Link>
            <Link to="/contact" className="hover:text-slate-600 transition-colors">Cookie Preferences</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
