import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Building2,
  Tag,
  Clock,
  AlertCircle,
  Loader2,
  Bell,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { RecurringBillFrequency } from '@/types/recurringBill';

const FREQUENCY_OPTIONS: { value: RecurringBillFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly (Every 2 weeks)' },
  { value: 'daily', label: 'Daily' },
  { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
  { value: 'semi_annual', label: 'Semi-Annual (Every 6 months)' },
  { value: 'annual', label: 'Annual (Yearly)' },
];

const CATEGORY_OPTIONS = [
  { value: 'utilities', label: 'Utilities & Power' },
  { value: 'subscriptions', label: 'Digital Subscriptions & SaaS' },
  { value: 'housing', label: 'Housing & Rent' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'telecom', label: 'Internet & Mobile' },
  { value: 'education', label: 'Education & Tuition' },
  { value: 'fitness', label: 'Gym & Fitness' },
  { value: 'bills', label: 'General Bills' },
];

export const AddRecurringBillModal: React.FC = () => {
  const {
    isAddRecurringBillOpen,
    setIsAddRecurringBillOpen,
    editingRecurringBill,
    setEditingRecurringBill,
    accounts,
    createRecurringBill,
    updateRecurringBill,
  } = useFinance();

  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('utilities');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringBillFrequency>('monthly');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingRecurringBill) {
      setName(editingRecurringBill.name || '');
      setMerchant(editingRecurringBill.merchant || '');
      setCategory(editingRecurringBill.category || 'utilities');
      setAmount(editingRecurringBill.amount?.toString() || '');
      setFrequency(editingRecurringBill.frequency || 'monthly');
      setStartDate(editingRecurringBill.start_date || new Date().toISOString().split('T')[0]);
      setEndDate(editingRecurringBill.end_date || '');
      setAccountId(editingRecurringBill.account_id || '');
      setReminderDays(editingRecurringBill.reminder_days_before ?? 3);
    } else {
      setName('');
      setMerchant('');
      setCategory('utilities');
      setAmount('');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setReminderDays(3);
    }
    setError(null);
  }, [editingRecurringBill, isAddRecurringBillOpen, accounts]);

  if (!isAddRecurringBillOpen) return null;

  const handleClose = () => {
    setIsAddRecurringBillOpen(false);
    setEditingRecurringBill(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!name.trim()) {
      setError('Bill name is required.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecurringBill) {
        await updateRecurringBill(editingRecurringBill.id, {
          name: name.trim(),
          merchant: merchant.trim() || undefined,
          category,
          amount: parsedAmount,
          frequency,
          start_date: startDate,
          end_date: endDate || undefined,
          account_id: accountId || undefined,
          reminder_days_before: reminderDays,
        });
      } else {
        await createRecurringBill({
          name: name.trim(),
          merchant: merchant.trim() || undefined,
          category,
          amount: parsedAmount,
          frequency,
          start_date: startDate,
          end_date: endDate || undefined,
          account_id: accountId || undefined,
          reminder_days_before: reminderDays,
        });
      }
      handleClose();
    } catch (err: unknown) {
      const eObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(eObj?.response?.data?.detail || eObj?.message || 'Failed to save recurring bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingRecurringBill ? 'Edit Recurring Bill' : 'New Recurring Bill'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track subscriptions, utilities, and scheduled payments with automatic due-date forecasting.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bill / Subscription Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, Electricity Bill, Home Wi-Fi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Merchant / Provider
              </label>
              <input
                type="text"
                placeholder="e.g. Tata Power, Spotify AB"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Billing Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Frequency
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringBillFrequency)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                First Due / Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                End Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Account (Optional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">No linked account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.account_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alert Reminder Window
              </label>
              <div className="relative">
                <Bell className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value={1}>1 day before due date</option>
                  <option value={3}>3 days before due date</option>
                  <option value={5}>5 days before due date</option>
                  <option value={7}>7 days before due date</option>
                  <option value={14}>14 days before due date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingRecurringBill ? 'Save Changes' : 'Create Recurring Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
