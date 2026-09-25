import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType, TransactionCategory } from '@/types/transaction';
import { toast } from 'sonner';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RefreshCw, AlertCircle } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api';

const CATEGORIES: { label: string; value: TransactionCategory }[] = [
  { label: 'Food & Dining', value: 'food' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Salary / Wages', value: 'salary' },
  { label: 'Transport', value: 'transport' },
  { label: 'Bills & Utilities', value: 'bills' },
  { label: 'Rent / Housing', value: 'rent' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Healthcare & Medical', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Investment', value: 'investment' },
  { label: 'Loan EMI', value: 'emi' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Cash', value: 'cash' },
  { label: 'Other', value: 'other' },
];

export const AddTransactionModal: React.FC = () => {
  const {
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    createTransaction,
    accounts,
  } = useFinance();

  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Handle transfer destination default
  useEffect(() => {
    if (transactionType === 'transfer') {
      const otherAcc = accounts.find((a) => a.id !== accountId);
      if (otherAcc) {
        setDestinationAccountId(otherAcc.id);
      }
    }
  }, [transactionType, accountId, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId) {
      toast.error('Please select an account.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    if (transactionType === 'transfer') {
      if (!destinationAccountId) {
        toast.error('Please select a destination account for the transfer.');
        return;
      }
      if (destinationAccountId === accountId) {
        toast.error('Source and destination accounts must be different.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        account_id: accountId,
        destination_account_id: transactionType === 'transfer' ? destinationAccountId : null,
        amount: numAmount,
        transaction_type: transactionType,
        category: transactionType === 'transfer' ? null : category,
        merchant: merchant.trim() || undefined,
        description: description.trim() || undefined,
        transaction_date: new Date(transactionDate).toISOString(),
        source: 'manual',
      });

      toast.success(
        `Transaction recorded: ₹${numAmount} (${transactionType})`
      );
      setIsAddTransactionOpen(false);

      // Reset form
      setMerchant('');
      setAmount('');
      setDescription('');
      setTransactionType('expense');
      setCategory('food');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to record transaction.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-teal-700" />
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        {accounts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>No Accounts Found</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              You must have at least one active financial account before recording transactions. Please navigate to Settings &gt; Connected Accounts to link or create an account.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddTransactionOpen(false)}
                className="rounded-xl bg-amber-700 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-800"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Transaction Type Toggle */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setTransactionType('expense');
                  setCategory('food');
                }}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  transactionType === 'expense'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransactionType('income');
                  setCategory('salary');
                }}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  transactionType === 'income'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Income
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('transfer')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  transactionType === 'transfer'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transfer
              </button>
            </div>

            {/* Account Selector */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {transactionType === 'transfer' ? 'Source Account' : 'Account'}
                </label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.account_type}) - ₹{Number(acc.current_balance || acc.balance || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Account (if transfer) */}
              {transactionType === 'transfer' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700">Destination Account</label>
                  <select
                    required
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    <option value="" disabled>Select destination account</option>
                    {accounts
                      .filter((acc) => acc.id !== accountId)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.account_type})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Merchant (or Transfer Label) */}
            {transactionType !== 'transfer' && (
              <div>
                <label className="text-xs font-semibold text-slate-700">Merchant / Payee</label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Swiggy, Amazon, Monthly Salary"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>
            )}

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ 0.00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Category (for non-transfer) */}
            {transactionType !== 'transfer' && (
              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">Description / Note</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional tag or memo..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsAddTransactionOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Record Transaction</span>
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
