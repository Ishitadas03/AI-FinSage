import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Target,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { setIsAddTransactionOpen, setIsChatOpen } = useFinance();

  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Ledger',
      href: '/transactions',
      icon: Receipt,
    },
    {
      name: 'Add',
      isAction: true,
      onClick: () => setIsAddTransactionOpen(true),
      icon: Plus,
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: Target,
    },
    {
      name: 'Copilot',
      isAction: true,
      onClick: () => setIsChatOpen(true),
      icon: Sparkles,
      badge: 'AI',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;

          if (item.isAction) {
            if (item.name === 'Add') {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  aria-label="Add transaction"
                  className="flex flex-col items-center justify-center -mt-4 group focus:outline-none"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-800/30 border-2 border-white transition-transform active:scale-95 group-hover:bg-teal-800">
                    <Plus className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 mt-1">Add</span>
                </button>
              );
            }

            return (
              <button
                key={idx}
                onClick={item.onClick}
                aria-label={item.name}
                className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-500 hover:text-teal-700 transition-colors relative min-w-[54px] active:scale-95"
              >
                <div className="relative">
                  <Icon className="h-5 w-5 text-teal-600 animate-pulse" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 rounded-full bg-teal-100 text-teal-800 text-[8px] font-extrabold px-1 leading-tight">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-teal-700 mt-0.5">
                  {item.name}
                </span>
              </button>
            );
          }

          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={idx}
              to={item.href!}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[54px] active:scale-95',
                  isActive
                    ? 'text-teal-800 font-bold'
                    : 'text-slate-400 hover:text-slate-700 font-medium'
                )
              }
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    isActive ? 'text-teal-700 stroke-[2.2] scale-105' : 'text-slate-400'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] mt-0.5 tracking-tight',
                  isActive ? 'text-teal-800 font-bold' : 'text-slate-500 font-medium'
                )}
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
