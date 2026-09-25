import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Menu,
  Sparkles,
  User,
  Settings,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Target,
  FileText,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const {
    user,
    selectedPeriod,
    setSelectedPeriod,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setIsSearchOpen,
    setIsChatOpen,
    setIsOnboardingOpen,
    resetAllData,
    logout,
  } = useFinance();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadNotifications = notifications.filter((n) => !n.read);

  const months = [
    'September 2026',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
  ];

  const shortMonth = selectedPeriod.replace('2026', "'26").replace('September', 'Sep').replace('August', 'Aug').replace('July', 'Jul').replace('June', 'Jun');

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-3.5 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left side: Mobile Menu Drawer trigger & Search */}
      <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar (Full on sm+, icon button on mobile) */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex group max-w-md flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
        >
          <Search className="h-4 w-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
          <span className="flex-1 truncate text-xs sm:text-[13px] text-slate-500">
            Search transactions, goals, or ask FinSage...
          </span>
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-block">
            Ctrl K
          </kbd>
        </div>

        {/* Mobile Search Quick Trigger Icon */}
        <button
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search"
          className="flex sm:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-teal-700 hover:bg-white"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* PWA Install Button (renders when installable) */}
        <PWAInstallButton variant="compact" label="Install" />

        {/* Ask AI FinSage Quick Trigger (Desktop & Tablet) */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="hidden md:flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 border border-teal-200/70 hover:bg-teal-100 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
          <span>Ask FinSage</span>
        </button>

        {/* Month Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-[13px] font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="hidden sm:inline">{selectedPeriod}</span>
              <span className="inline sm:hidden text-[11px] font-bold">{shortMonth}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white p-1 rounded-2xl shadow-lg border border-slate-100">
            <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Financial Period
            </DropdownMenuLabel>
            {months.map((m) => (
              <DropdownMenuItem
                key={m}
                onClick={() => {
                  setSelectedPeriod(m);
                  toast.success(`Period changed to ${m}`);
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer",
                  selectedPeriod === m ? "bg-teal-50 text-teal-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{m}</span>
                {selectedPeriod === m && <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Popover */}
        <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
          <PopoverTrigger asChild>
            <button
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[calc(100vw-24px)] max-w-sm rounded-2xl bg-white p-0 shadow-xl border border-slate-100 overflow-hidden mr-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Notifications</h4>
                {unreadNotifications.length > 0 && (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    {unreadNotifications.length} new
                  </span>
                )}
              </div>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="font-semibold text-slate-700">No new alerts</p>
                  <p className="text-[11px] mt-0.5">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors cursor-pointer",
                      n.read ? "bg-white opacity-75 hover:bg-slate-50" : "bg-teal-50/30 hover:bg-teal-50/50"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'security' ? (
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                      ) : n.type === 'goal' ? (
                        <Target className="h-4 w-4 text-teal-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 text-xs truncate">{n.title}</h5>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl p-1 text-left hover:bg-slate-100 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-xs font-bold text-white shadow-xs">
                {user.avatar || user.name.charAt(0)}
              </div>
              <div className="hidden xl:block">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                  Premium Tier
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white p-1 rounded-2xl shadow-xl border border-slate-100">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>

            <DropdownMenuItem
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              <span>Settings & Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate('/help-support')}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Help & FAQ</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-100" />

            <DropdownMenuItem
              onClick={async () => {
                await logout();
                toast.success('Signed out successfully.');
                navigate('/signin');
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
