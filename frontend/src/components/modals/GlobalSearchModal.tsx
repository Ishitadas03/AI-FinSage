import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
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
  PlusCircle,
  Upload,
  Bot,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

export const GlobalSearchModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    isSearchOpen,
    setIsSearchOpen,
    transactions,
    goals,
    setIsAddTransactionOpen,
    setIsAddGoalOpen,
    setIsImportModalOpen,
    setIsChatOpen,
  } = useFinance();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchOpen, setIsSearchOpen]);

  const handleSelect = (callback: () => void) => {
    setIsSearchOpen(false);
    callback();
  };

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <CommandInput placeholder="Type a command, page, transaction, or goal..." />
      <CommandList className="max-h-96">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => handleSelect(() => setIsAddTransactionOpen(true))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-teal-600" />
            <span>Add New Transaction</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setIsAddGoalOpen(true))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Target className="h-4 w-4 text-teal-600" />
            <span>Create New Financial Goal</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setIsImportModalOpen(true))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-teal-600" />
            <span>Import Bank Statement (CSV)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setIsChatOpen(true))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Bot className="h-4 w-4 text-teal-600" />
            <span>Ask FinSage AI Copilot</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect(() => navigate('/dashboard'))}>
            <LayoutDashboard className="h-4 w-4 mr-2 text-slate-500" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/'))}>
            <Sparkles className="h-4 w-4 mr-2 text-teal-600" />
            <span>Landing Page</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/transactions'))}>
            <Receipt className="h-4 w-4 mr-2 text-slate-500" />
            <span>Transactions & Statement</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/spending'))}>
            <PieChart className="h-4 w-4 mr-2 text-slate-500" />
            <span>Spending Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/budgets'))}>
            <Wallet className="h-4 w-4 mr-2 text-slate-500" />
            <span>Budgets & Limits</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/goals'))}>
            <Target className="h-4 w-4 mr-2 text-slate-500" />
            <span>Financial Goals</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/future-self'))}>
            <Sparkles className="h-4 w-4 mr-2 text-teal-600" />
            <span>Future Self Simulator</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/debt-emi'))}>
            <CreditCard className="h-4 w-4 mr-2 text-slate-500" />
            <span>Debt & EMI Calculator</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/scam-shield'))}>
            <ShieldAlert className="h-4 w-4 mr-2 text-rose-500" />
            <span>Scam Shield & Security</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/financial-health'))}>
            <Activity className="h-4 w-4 mr-2 text-slate-500" />
            <span>Financial Health Score</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/ai-report'))}>
            <FileText className="h-4 w-4 mr-2 text-slate-500" />
            <span>AI Monthly Report</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/market-intel'))}>
            <TrendingUp className="h-4 w-4 mr-2 text-slate-500" />
            <span>Market Intel & Portfolio</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/settings'))}>
            <Settings className="h-4 w-4 mr-2 text-slate-500" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate('/help-support'))}>
            <HelpCircle className="h-4 w-4 mr-2 text-slate-500" />
            <span>Help & Support</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Active Goals">
          {goals.map((g) => (
            <CommandItem
              key={g.id}
              onSelect={() => handleSelect(() => navigate('/goals'))}
              className="flex items-center justify-between"
            >
              <span>{g.name}</span>
              <span className="text-xs text-slate-400 font-mono">
                ₹{(g.currentAmount / 100000).toFixed(1)}L / ₹{(g.targetAmount / 100000).toFixed(1)}L
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
