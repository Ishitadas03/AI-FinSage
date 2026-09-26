import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Car,
  Plane,
  Home,
  Laptop,
  Trash2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { ApiGoal } from '@/types/goal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api';
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

const GOAL_TYPE_LABELS: Record<string, string> = {
  emergency_fund: 'Emergency Fund',
  education: 'Education & Tuition',
  travel: 'Vacation & Travel',
  vehicle: 'Car / Vehicle',
  home: 'Home & Real Estate',
  retirement: 'Retirement Wealth',
  investment: 'Investment Portfolio',
  purchase: 'Tech & Purchase',
  other: 'Other Target',
};

export const Goals: React.FC = () => {
  const {
    goals,
    isLoadingGoals,
    goalsError,
    loadGoals,
    addFundsToGoal,
    deleteGoal,
    setIsAddGoalOpen,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Deposit modal state
  const [fundingGoal, setFundingGoal] = useState<ApiGoal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const totalTarget = goals.reduce((acc, g) => acc + Number(g.target_amount || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + Number(g.current_amount || 0), 0);
  const totalMonthlyCommitment = activeGoals.reduce(
    (acc, g) => acc + Number(g.derived_state?.required_monthly_contribution || 0),
    0
  );

  // Goal Compounding projection chart data
  const projectionData = [
    { year: '2026 (Now)', current: totalSaved, target: totalSaved },
    { year: '2027', current: totalSaved + totalMonthlyCommitment * 12 * 1.08, target: totalTarget * 0.4 },
    { year: '2028', current: totalSaved + totalMonthlyCommitment * 24 * 1.15, target: totalTarget * 0.7 },
    { year: '2029', current: totalSaved + totalMonthlyCommitment * 36 * 1.25, target: totalTarget * 0.9 },
    { year: '2030 (Target)', current: totalTarget > 0 ? totalTarget * 1.05 : 100000, target: totalTarget },
  ];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingGoal || !fundAmount || Number(fundAmount) <= 0) {
      toast.error('Please enter a valid deposit amount.');
      return;
    }

    const depositVal = Number(fundAmount);
    const remainingVal = Number(fundingGoal.derived_state?.remaining_amount ?? (fundingGoal.target_amount - fundingGoal.current_amount));

    if (depositVal > remainingVal && remainingVal > 0) {
      toast.error(`Deposit amount cannot exceed remaining target of ${formatCurrency(remainingVal)}.`);
      return;
    }

    setIsDepositing(true);
    try {
      await addFundsToGoal(fundingGoal.id, depositVal, fundNote.trim() || 'Manual Deposit');
      toast.success(`Deposited ${formatCurrency(depositVal)} into ${fundingGoal.name}!`);
      setFundingGoal(null);
      setFundAmount('');
      setFundNote('');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to record deposit.');
      toast.error(msg);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDelete = async (g: ApiGoal) => {
    if (window.confirm(`Are you sure you want to delete goal '${g.name}'?`)) {
      try {
        await deleteGoal(g.id);
        toast.success(`Removed '${g.name}' goal.`);
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to delete goal.');
        toast.error(msg);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'emergency_fund': return ShieldCheck;
      case 'vehicle': return Car;
      case 'travel': return Plane;
      case 'home': return Home;
      case 'purchase': return Laptop;
      case 'retirement': return TrendingUp;
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
            Automate capital accumulation and track life goals with real PostgreSQL backend logic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadGoals()}
            disabled={isLoadingGoals}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Refresh goals from server"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", isLoadingGoals && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Set New Goal</span>
          </button>
        </div>
      </div>

      {/* Backend API Error Alert Banner */}
      {goalsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{goalsError}</span>
          </div>
          <button
            onClick={() => loadGoals()}
            className="font-bold underline hover:text-rose-900 ml-4"
          >
            Try Again
          </button>
        </div>
      )}

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
          <span className="text-xs font-semibold text-slate-500">Required Monthly Savings</span>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {formatCurrency(totalMonthlyCommitment)} / mo
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated from target dates</p>
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
            <p className="text-xs text-slate-400">Compounding projection based on regular monthly contributions</p>
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

      {/* Loading Skeleton */}
      {isLoadingGoals && goals.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card-fintech p-5 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingGoals && goals.length === 0 && !goalsError && (
        <div className="card-fintech p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Financial Goals Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Set your first financial goal to track progress, automate monthly contributions, and build wealth.
          </p>
          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="mt-2 flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Set New Goal</span>
          </button>
        </div>
      )}

      {/* Goal Cards Grid */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(activeTab === 'active' ? activeGoals : completedGoals).map((g) => {
            const Icon = getIcon(g.goal_type);
            const currentVal = Number(g.current_amount || 0);
            const targetVal = Number(g.target_amount || 0);
            const percent = Number(g.derived_state?.progress_percentage ?? Math.min(100, Math.round((currentVal / (targetVal || 1)) * 100)));
            const isCompleted = g.status === 'completed' || percent >= 100;
            const monthlyReq = g.derived_state?.required_monthly_contribution;

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
                        <span className="text-[10px] text-slate-400 font-medium">
                          {GOAL_TYPE_LABELS[g.goal_type] || g.goal_type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-teal-50 text-teal-800 font-numeric"
                      )}
                    >
                      {Math.round(percent)}%
                    </span>
                  </div>

                  {/* Amount Progress */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 font-numeric text-sm">
                        {formatCurrency(currentVal)}
                      </span>
                      <span className="text-slate-400 font-numeric">
                        Target: {formatCurrency(targetVal)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isCompleted ? "bg-emerald-600" : "bg-teal-600"
                        )}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target Date</span>
                      <span className="font-semibold text-slate-800">{g.target_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Monthly SIP</span>
                      <span className="font-semibold text-slate-800 font-numeric">
                        {isCompleted
                          ? 'Achieved'
                          : monthlyReq !== null && monthlyReq !== undefined
                          ? `${formatCurrency(monthlyReq)}/mo`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  {!isCompleted ? (
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
                    onClick={() => handleDelete(g)}
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
      )}

      {/* Add Funds / Deposit Modal */}
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
                  min="1"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="₹ 10,000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Note / Reference (Optional)</label>
                <input
                  type="text"
                  value={fundNote}
                  onChange={(e) => setFundNote(e.target.value)}
                  placeholder="e.g. September SIP deposit"
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
                  disabled={isDepositing}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                >
                  {isDepositing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Deposit & Allocate</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
