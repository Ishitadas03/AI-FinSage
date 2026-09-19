import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Budget } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const Budgets: React.FC = () => {
  const { budgets, addBudget, editBudget, deleteBudget } = useFinance();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form states
  const [newCategory, setNewCategory] = useState('');
  const [newAllocated, setNewAllocated] = useState('');

  // Overall totals
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const remainingBudget = totalAllocated - totalSpent;
  const overallProgress = Math.round((totalSpent / (totalAllocated || 1)) * 100);

  // Categories exceeding 80% threshold
  const warningBudgets = budgets.filter((b) => (b.spent / b.allocated) >= 0.8);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newAllocated || Number(newAllocated) <= 0) {
      toast.error('Please specify category and allocation amount.');
      return;
    }

    addBudget({
      category: newCategory.trim(),
      allocated: Number(newAllocated),
      spent: 0,
      color: '#0F766E',
      icon: 'Wallet',
      rollover: true,
    });

    toast.success(`Budget category '${newCategory}' created.`);
    setIsCreateOpen(false);
    setNewCategory('');
    setNewAllocated('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    editBudget(editingBudget.id, {
      allocated: Number(editingBudget.allocated),
      category: editingBudget.category,
    });
    toast.success('Budget allocation updated.');
    setEditingBudget(null);
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
            Set proactive guardrails and prevent month-end discretionary overspending.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>Create Category Budget</span>
        </button>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Budget Allocation</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalAllocated)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">For September 2026</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Total Utilized</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-[11px] text-teal-700 font-bold mt-1">{overallProgress}% of budget consumed</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Remaining Buffer</span>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-numeric">
            {formatCurrency(remainingBudget)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">11 days left in month</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Daily Allowed Run-Rate</span>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(Math.round(remainingBudget / 11))} / day
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
              {warningBudgets.length} Category Budgets Exceeding 80% Threshold
            </h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              {warningBudgets.map((b) => `${b.category} (${Math.round((b.spent / b.allocated) * 100)}%)`).join(', ')} are nearing monthly caps. FinSage suggests deferring non-essential checkouts until next month.
            </p>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const percent = Math.round((b.spent / b.allocated) * 100);
          const isOver = percent >= 95;
          const isWarning = percent >= 80 && percent < 95;

          return (
            <div key={b.id} className="card-fintech p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.color }} />
                    <h3 className="text-sm font-bold text-slate-900">{b.category}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBudget(b)}
                      className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit limit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteBudget(b.id);
                        toast.success(`Removed ${b.category} budget.`);
                      }}
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
                      {formatCurrency(b.spent)} <span className="text-slate-400 font-normal">/ {formatCurrency(b.allocated)}</span>
                    </span>
                    <span
                      className={cn(
                        "font-bold text-xs",
                        isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-emerald-700"
                      )}
                    >
                      {percent}%
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
                  <strong className={b.allocated - b.spent < 0 ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
                    {formatCurrency(b.allocated - b.spent)}
                  </strong>
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  Auto-Rollover Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Budget Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-teal-700" />
              Create Category Budget
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Category Name</label>
              <input
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Travel & Flights, Gadgets, Health & Gym"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Monthly Spending Limit (₹)</label>
              <input
                type="number"
                required
                min="500"
                value={newAllocated}
                onChange={(e) => setNewAllocated(e.target.value)}
                placeholder="₹ 10,000"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
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
                className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
              >
                Create Limit
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
                Edit {editingBudget.category} Budget
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Allocated Cap (₹)</label>
                <input
                  type="number"
                  required
                  value={editingBudget.allocated}
                  onChange={(e) => setEditingBudget({ ...editingBudget, allocated: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
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
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
