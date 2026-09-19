import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Clock,
  ShieldCheck,
  Car,
  Plane,
  Home,
  Laptop,
  Trash2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Goal } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const Goals: React.FC = () => {
  const { goals, addFundsToGoal, deleteGoal, setIsAddGoalOpen } = useFinance();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Add funds modal state
  const [fundingGoal, setFundingGoal] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalMonthlyCommitment = activeGoals.reduce((acc, g) => acc + g.monthlyContribution, 0);

  // Goal Compounding projection
  const projectionData = [
    { year: '2026 (Now)', current: totalSaved, target: totalSaved },
    { year: '2027', current: totalSaved + totalMonthlyCommitment * 12 * 1.08, target: totalTarget * 0.4 },
    { year: '2028', current: totalSaved + totalMonthlyCommitment * 24 * 1.15, target: totalTarget * 0.7 },
    { year: '2029', current: totalSaved + totalMonthlyCommitment * 36 * 1.25, target: totalTarget * 0.9 },
    { year: '2030 (Full Goal)', current: totalTarget * 1.05, target: totalTarget },
  ];

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingGoal || !fundAmount || Number(fundAmount) <= 0) {
      toast.error('Please enter a valid deposit amount.');
      return;
    }

    addFundsToGoal(fundingGoal.id, Number(fundAmount));
    toast.success(`Deposited ${formatCurrency(Number(fundAmount))} into ${fundingGoal.name}!`);
    setFundingGoal(null);
    setFundAmount('');
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return ShieldCheck;
      case 'Car': return Car;
      case 'Plane': return Plane;
      case 'Home': return Home;
      case 'Laptop': return Laptop;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Goals & Milestones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate monthly capital contributions and accelerate major life aspirations.
          </p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Goals Target</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalTarget)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {goals.length} life targets</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Capital Saved</span>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-numeric">
            {formatCurrency(totalSaved)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {Math.round((totalSaved / (totalTarget || 1)) * 100)}% overall milestone progress
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Monthly Auto-SIP Commitment</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {formatCurrency(totalMonthlyCommitment)} / mo
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Automated on 1st of month</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Completed Milestones</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {completedGoals.length} Goals Achieved
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-1">100% disciplined completion</p>
        </div>
      </div>

      {/* Goal Growth Trajectory Chart */}
      <div className="card-fintech p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Aggregate Goal Fulfillment Trajectory</h3>
            <p className="text-xs text-slate-400">Compounding projection based on regular monthly additions</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Projected Accumulation
            </span>
          </div>
        </div>

        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goalAccum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Accumulation']} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Area type="monotone" dataKey="current" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#goalAccum)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs for Active vs Completed Goals */}
      <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
            activeTab === 'active' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Active Goals ({activeGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
            activeTab === 'completed' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Completed Goals ({completedGoals.length})
        </button>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(activeTab === 'active' ? activeGoals : completedGoals).map((g) => {
          const Icon = getIcon(g.icon);
          const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

          return (
            <div key={g.id} className="card-fintech p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-sm border border-teal-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{g.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">{g.category}</span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      g.status === 'completed'
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-teal-50 text-teal-800 font-numeric"
                    )}
                  >
                    {percent}%
                  </span>
                </div>

                {/* Amount Progress */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 font-numeric text-sm">
                      {formatCurrency(g.currentAmount)}
                    </span>
                    <span className="text-slate-400 font-numeric">
                      Target: {formatCurrency(g.targetAmount)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        g.status === 'completed' ? "bg-emerald-600" : "bg-teal-600"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Target Date</span>
                    <span className="font-semibold text-slate-800">{g.deadline}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monthly SIP</span>
                    <span className="font-semibold text-slate-800 font-numeric">
                      {g.monthlyContribution > 0 ? formatCurrency(g.monthlyContribution) : 'Achieved'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                {g.status === 'active' ? (
                  <button
                    onClick={() => setFundingGoal(g)}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Funds</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Goal Fully Funded
                  </span>
                )}

                <button
                  onClick={() => {
                    deleteGoal(g.id);
                    toast.success(`Removed ${g.name} goal.`);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Delete goal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Funds Modal */}
      {fundingGoal && (
        <Dialog open={!!fundingGoal} onOpenChange={(open) => !open && setFundingGoal(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-teal-700" />
                Deposit to {fundingGoal.name}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleDeposit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Deposit Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="₹ 10,000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFundingGoal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                >
                  Deposit & Allocate
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
