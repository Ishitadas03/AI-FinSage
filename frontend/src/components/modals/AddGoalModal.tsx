import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/context/FinanceContext';
import { Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { GoalPriority, GoalType } from '@/types/goal';

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'emergency_fund', label: 'Emergency Fund (Safety)' },
  { value: 'education', label: 'Education & Tuition' },
  { value: 'travel', label: 'Vacation & Travel' },
  { value: 'vehicle', label: 'Car / Vehicle Purchase' },
  { value: 'home', label: 'Home / Real Estate' },
  { value: 'retirement', label: 'Retirement Wealth' },
  { value: 'investment', label: 'Investment Portfolio' },
  { value: 'purchase', label: 'Tech & Shopping Purchase' },
  { value: 'other', label: 'Other Goal' },
];

const getDefaultTargetDate = () => {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 2);
  return future.toISOString().split('T')[0];
};

export const AddGoalModal: React.FC = () => {
  const { isAddGoalOpen, setIsAddGoalOpen, createGoal } = useFinance();

  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('emergency_fund');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate());
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || Number(targetAmount) <= 0) {
      toast.error('Please enter a goal name and valid target amount.');
      return;
    }

    const initialVal = Number(currentAmount) || 0;
    const targetVal = Number(targetAmount);

    if (initialVal > targetVal) {
      toast.error('Initial savings cannot exceed target amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createGoal({
        name: name.trim(),
        goal_type: goalType,
        target_amount: targetVal,
        current_amount: initialVal,
        target_date: targetDate,
        priority,
        description: description.trim() || undefined,
      });

      toast.success(`Financial goal '${name}' created.`);
      setIsAddGoalOpen(false);

      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDescription('');
      setTargetDate(getDefaultTargetDate());
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to create financial goal.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-700" />
            Set New Financial Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Goal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dream Wedding, Emergency Fund, Home Down Payment"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Goal Category</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              >
                {GOAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Target Amount (₹)</label>
              <input
                type="number"
                required
                min="100"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="₹ 5,00,000"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Initial Savings (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="₹ 50,000"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Target Target Date</label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddGoalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Goal</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
