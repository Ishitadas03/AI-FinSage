import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  Target,
  Sparkles,
  CreditCard,
  ShieldAlert,
  Activity,
  FileText,
  TrendingUp,
  Settings,
  HelpCircle,
  ArrowRight,
  Leaf,
  X,
} from 'lucide-react';
import { FinSageLogo } from '@/components/brand/FinSageLogo';
import { cn } from '@/lib/utils';
import { useFinance } from '@/context/FinanceContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { securityAlerts } = useFinance();

  const pendingSecurityCount = securityAlerts.filter((a) => a.status === 'pending').length;

  const navSections: NavSection[] = [
    {
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MONEY',
      items: [
        { name: 'Transactions', href: '/transactions', icon: Receipt },
        { name: 'Spending', href: '/spending', icon: PieChart },
        { name: 'Budgets', href: '/budgets', icon: Wallet },
      ],
    },
    {
      title: 'PLAN',
      items: [
        { name: 'Goals', href: '/goals', icon: Target },
        { name: 'Future Self', href: '/future-self', icon: Sparkles },
        { name: 'Debt & EMI', href: '/debt-emi', icon: CreditCard },
      ],
    },
    {
      title: 'PROTECT',
      items: [
        {
          name: 'Scam Shield',
          href: '/scam-shield',
          icon: ShieldAlert,
          badge: pendingSecurityCount > 0 ? `${pendingSecurityCount}` : undefined,
        },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { name: 'Financial Health', href: '/financial-health', icon: Activity },
        { name: 'AI Report', href: '/ai-report', icon: FileText },
        { name: 'Market Intel', href: '/market-intel', icon: TrendingUp },
      ],
    },
    {
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'Help & Support', href: '/help-support', icon: HelpCircle },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <NavLink to="/" className="flex items-center group py-1" onClick={onCloseMobile}>
            <FinSageLogo variant="horizontal" height={34} />
          </NavLink>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.title && (
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-teal-50/90 text-teal-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          isActive ? "text-teal-700" : "text-slate-400"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-600">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Future Self Promo Card */}
        <div className="p-3 border-t border-slate-100">
          <div
            onClick={() => {
              navigate('/future-self');
              onCloseMobile?.();
            }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 p-3.5 text-white cursor-pointer shadow-md group transition-all hover:shadow-lg"
          >
            {/* Soft decorative background circles */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-500/10 blur-xl" />
            <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-emerald-400/10 blur-lg" />

            <div className="relative z-10">
              <h4 className="text-[13px] font-bold tracking-tight text-white leading-snug">
                Your future <br />
                self will thank you.
              </h4>
              <p className="mt-1 text-[11px] text-teal-200/90 font-medium">
                Plan. Save. Achieve.
              </p>

              <div className="mt-3 flex items-center justify-end">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-teal-900 shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
