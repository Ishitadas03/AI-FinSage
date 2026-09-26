import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { ApiBudget, BudgetPeriod } from '@/types/budget';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CATEGORY_OPTIONS = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'shopping', label: 'Shopping & Retail' },
  { value: 'transport', label: 'Transportation' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'rent', label: 'Rent & Housing' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'investment', label: 'Investments' },
  { value: 'emi', label: 'EMI & Loans' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'salary', label: 'Salary' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other / Misc' },
];

const getCurrentMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
  return { firstDay, lastDay };
};

export const Budgets: React.FC = () => {
  const {
    budgets,
    isLoadingBudgets,
    budgetsError,
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useFinance();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ApiBudget | null>(null);

  // Form states for creation
  const { firstDay: defaultStart, lastDay: defaultEnd } = getCurrentMonthDates();
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('food');
  const [newAmount, setNewAmount] = useState('');
  const [newPeriod, setNewPeriod] = useState<BudgetPeriod>('monthly');
  const [newStartDate, setNewStartDate] = useState(defaultStart);
  const [newEndDate, setNewEndDate] = useState(defaultEnd);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('food');
  const [editAmount, setEditAmount] = useState('');
  const [editStartDate, setEditStartDate] = useState(defaultStart);
  const [editEndDate, setEditEndDate] = useState(defaultEnd);

  // Helper for category label
  const getCategoryLabel = (cat: string) => {
    const match = CATEGORY_OPTIONS.find((c) => c.value === cat.toLowerCase());
    return match ? match.label : cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Summary Metrics computed from authoritative backend state
  const totalAllocated = budgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spending?.actual_spending || 0), 0);
  const remainingBudget = totalAllocated - totalSpent;
  const overallProgress = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());
  const dailyAllowedRunRate = remainingBudget > 0 ? Math.round(remainingBudget / daysRemaining) : 0;

  // Categories exceeding 80% threshold
  const warningBudgets = budgets.filter(
    (b) => (b.spending?.spending_percentage ?? 0) >= 80 || b.spending?.status === 'warning' || b.spending?.status === 'over_budget'
  );

  const resetCreateForm = () => {
    setNewName('');
    setNewCategory('food');
    setNewAmount('');
    setNewPeriod('monthly');
    const { firstDay, lastDay } = getCurrentMonthDates();
    setNewStartDate(firstDay);
    setNewEndDate(lastDay);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAmount || Number(newAmount) <= 0) {
      toast.error('Please specify a valid budget name and allocation amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBudget({
        name: newName.trim(),
        category: newCategory,
        amount: Number(newAmount),
        period: newPeriod,
        start_date: newStartDate,
        end_date: newEndDate,
      });

      toast.success(`Budget category '${newName}' created.`);
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to create budget.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (b: ApiBudget) => {
    setEditingBudget(b);
    setEditName(b.name);
    setEditCategory(b.category);
    setEditAmount(String(b.amount));
    setEditStartDate(b.start_date);
    setEditEndDate(b.end_date);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    if (!editName.trim() || !editAmount || Number(editAmount) <= 0) {
      toast.error('Please specify a valid name and allocation amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBudget(editingBudget.id, {
        name: editName.trim(),
        category: editCategory,
        amount: Number(editAmount),
        start_date: editStartDate,
        end_date: editEndDate,
      });

      toast.success('Budget allocation updated.');
      setEditingBudget(null);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to update budget.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (b: ApiBudget) => {
    if (window.confirm(`Are you sure you want to delete budget '${b.name}'?`)) {
      try {
        await deleteBudget(b.id);
        toast.success(`Removed '${b.name}' budget.`);
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to delete budget.');
        toast.error(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Monthly Budgets & Category Caps
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set proactive guardrails backed by your real FastAPI database transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadBudgets()}
            disabled={isLoadingBudgets}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Refresh budget metrics from server"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", isLoadingBudgets && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Create Category Budget</span>
          </button>
        </div>
      </div>

      {/* Backend API Error Alert Banner */}
      {budgetsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{budgetsError}</span>
          </div>
          <button
            onClick={() => loadBudgets()}
            className="font-bold underline hover:text-rose-900 ml-4"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Budget Allocation</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalAllocated)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {budgets.length} category caps
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Utilized</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-[11px] text-teal-700 font-bold mt-1">
            {overallProgress}% of budget consumed
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Remaining Buffer</span>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-numeric">
            {formatCurrency(remainingBudget)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {daysRemaining} days left in month
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Daily Allowed Run-Rate</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(dailyAllowedRunRate)} / day
          </div>
          <p className="text-[11px] text-slate-400 mt-1">To stay 100% within limits</p>
        </div>
      </div>

      {/* Warning Alert Banner if any budget is near limit */}
      {warningBudgets.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900">
              {warningBudgets.length} Category Budget{warningBudgets.length > 1 ? 's' : ''} Exceeding 80% Threshold
            </h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              {warningBudgets
                .map((b) => `${b.name} (${Math.round(b.spending?.spending_percentage || 0)}%)`)
                .join(', ')}{' '}
              are nearing or exceeding caps. Consider deferring non-essential expenses.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingBudgets && budgets.length === 0 && (
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
      {!isLoadingBudgets && budgets.length === 0 && !budgetsError && (
        <div className="card-fintech p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Category Budgets Set Up Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Create your first budget cap to track live category expenses against your real account transactions.
          </p>
          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            className="mt-2 flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Budget Limit</span>
          </button>
        </div>
      )}

      {/* Category Budgets Grid */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const spent = Number(b.spending?.actual_spending || 0);
            const allocated = Number(b.amount || 0);
            const percent = Number(b.spending?.spending_percentage || (allocated > 0 ? (spent / allocated) * 100 : 0));
            const status = b.spending?.status || (percent >= 100 ? 'over_budget' : percent >= 80 ? 'warning' : 'healthy');

            const isOver = status === 'over_budget' || percent >= 100;
            const isWarning = status === 'warning' || (percent >= 80 && percent < 100);

            return (
              <div key={b.id} className="card-fintech p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-3 w-3 rounded-full shrink-0",
                          isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-teal-600"
                        )}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {getCategoryLabel(b.category)} • {b.period}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit budget limit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 font-numeric">
                        {formatCurrency(spent)}{' '}
                        <span className="text-slate-400 font-normal">/ {formatCurrency(allocated)}</span>
                      </span>
                      <span
                        className={cn(
                          "font-bold text-xs",
                          isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-emerald-700"
                        )}
                      >
                        {Math.round(percent)}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-teal-600"
                        )}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Info */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <span>
                    Remaining:{' '}
                    <strong className={allocated - spent < 0 ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
                      {formatCurrency(Math.max(0, allocated - spent))}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {b.start_date} to {b.end_date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-teal-700" />
              Create Category Budget Limit
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Budget Name / Label</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Monthly Grocery Cap, Swiggy & Dining"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Tracking Period</label>
                <select
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value as BudgetPeriod)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Spending Limit (₹)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="₹ 10,000"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">End Date</label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Create Limit</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit {editingBudget.name}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Budget Name / Label</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Allocation Cap (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
