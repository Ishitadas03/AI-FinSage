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
  Sparkle,
  CheckCircle2,
  ShieldAlert,
  Target,
  FileText,
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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      {/* Left side: Mobile Menu & Global Search */}
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar (Matching Reference) */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="group flex max-w-md flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
        >
          <Search className="h-4 w-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
          <span className="flex-1 truncate text-[13px] text-slate-500">
            Search transactions, goals, or ask FinSage...
          </span>
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-block">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Ask AI FinSage Quick Trigger */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="hidden sm:flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 border border-teal-200/70 hover:bg-teal-100 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
          <span>Ask FinSage</span>
        </button>

        {/* Month Selector Dropdown (Matching Reference) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{selectedPeriod}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white p-1 rounded-xl shadow-lg border border-slate-100">
            <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Select Financial Period
            </DropdownMenuLabel>
            {months.map((m) => (
              <DropdownMenuItem
                key={m}
                onClick={() => {
                  setSelectedPeriod(m);
                  toast.success(`Period changed to ${m}`);
                }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer",
                  selectedPeriod === m ? "bg-teal-50 text-teal-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
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
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
              <Bell className="h-4 w-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 sm:w-96 rounded-2xl bg-white p-0 shadow-dropdown border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                {unreadNotifications.length > 0 && (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    {unreadNotifications.length} new
                  </span>
                )}
              </div>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs font-medium text-teal-700 hover:text-teal-900"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markNotificationRead(item.id);
                      if (item.link) {
                        navigate(item.link);
                        setIsNotifOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50",
                      !item.read ? "bg-teal-50/40" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        item.type === 'security' ? "bg-rose-100 text-rose-600" :
                        item.type === 'goal' ? "bg-blue-100 text-blue-600" :
                        item.type === 'insight' ? "bg-teal-100 text-teal-700" :
                        "bg-amber-100 text-amber-700"
                      )}
                    >
                      {item.type === 'security' ? <ShieldAlert className="h-4 w-4" /> :
                       item.type === 'goal' ? <Target className="h-4 w-4" /> :
                       item.type === 'insight' ? <FileText className="h-4 w-4" /> :
                       <Sparkle className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-xs font-semibold truncate", !item.read ? "text-slate-900" : "text-slate-700")}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 ml-1 whitespace-nowrap">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {!item.read && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-teal-600 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile Avatar Dropdown (Matching Reference RS badge) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 pr-2.5 text-left hover:bg-slate-50 shadow-sm transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
                {user.initials}
              </div>
              <span className="hidden md:inline-block text-[13px] font-semibold text-slate-800">
                {user.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white p-1.5 rounded-2xl shadow-dropdown border border-slate-100">
            <div className="px-3 py-2">
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                FinSage Pro Member
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              Profile & Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              Settings & Preferences
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-teal-700 cursor-pointer hover:bg-teal-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Re-run Onboarding Wizard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/help-support')}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                resetAllData();
                toast.success('Mock data restored to original state.');
              }}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Reset All Mock Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
