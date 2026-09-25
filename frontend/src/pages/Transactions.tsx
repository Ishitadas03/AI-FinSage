import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ApiTransaction, TransactionCategory, TransactionType } from '@/types/transaction';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Categories', value: 'All' },
  { label: 'Salary', value: 'salary' },
  { label: 'Food & Dining', value: 'food' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Transport', value: 'transport' },
  { label: 'Bills & Utilities', value: 'bills' },
  { label: 'Rent', value: 'rent' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Investment', value: 'investment' },
  { label: 'Loan EMI', value: 'emi' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Cash Withdrawal', value: 'cash' },
  { label: 'Other', value: 'other' },
];

export const Transactions: React.FC = () => {
  const {
    transactions,
    accounts,
    transactionsTotal,
    transactionsPage,
    transactionsTotalPages,
    transactionsPageSize,
    isLoadingTransactions,
    transactionsError,
    loadTransactions,
    deleteTransaction,
    updateTransaction,
    setIsAddTransactionOpen,
    setIsImportModalOpen,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Edit / Details Modal State
  const [viewingTx, setViewingTx] = useState<ApiTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<ApiTransaction | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch transactions with server-side filters & pagination
  const fetchFilteredTransactions = useCallback(
    (page: number, query: string, tab: string, category: string, accountId: string) => {
      loadTransactions({
        page,
        page_size: 10,
        merchant: query.trim() || undefined,
        transaction_type: tab === 'all' ? undefined : (tab as TransactionType),
        category: category === 'All' ? undefined : (category as TransactionCategory),
        account_id: accountId === 'All' ? undefined : accountId,
      });
    },
    [loadTransactions]
  );

  useEffect(() => {
    fetchFilteredTransactions(currentPage, searchQuery, activeTab, selectedCategory, selectedAccount);
  }, [fetchFilteredTransactions, currentPage, searchQuery, activeTab, selectedCategory, selectedAccount]);

  // Financial summary metrics
  const totalInflow = useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0),
    [transactions]
  );

  const totalOutflow = useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0),
    [transactions]
  );

  const netBalance = totalInflow - totalOutflow;

  const handleExportCSV = () => {
    const headers = 'ID,Date,Merchant,Description,Category,Type,Amount,Account\n';
    const rows = transactions
      .map((t) => {
        const accName = accounts.find((a) => a.id === t.account_id)?.name || t.account_id;
        return `"${t.id}","${t.transaction_date}","${t.merchant || ''}","${t.description || ''}","${t.category || 'Uncategorized'}","${t.transaction_type}",${t.amount},"${accName}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSage_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Transactions exported to CSV!');
  };

  const handleOpenEdit = (tx: ApiTransaction) => {
    setEditingTx(tx);
    setEditMerchant(tx.merchant || '');
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category || '');
    setEditDescription(tx.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    setIsSavingEdit(true);
    try {
      await updateTransaction(editingTx.id, {
        merchant: editMerchant.trim() || undefined,
        amount: Number(editAmount),
        category: editCategory ? (editCategory as TransactionCategory) : null,
        description: editDescription.trim() || undefined,
      });
      toast.success('Transaction updated successfully.');
      setEditingTx(null);
    } catch {
      toast.error('Failed to update transaction.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const success = await deleteTransaction(id);
      if (success) {
        toast.success('Transaction deleted successfully.');
      } else {
        toast.error('Failed to delete transaction.');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const formatCategoryLabel = (cat?: string | null) => {
    if (!cat) return 'Uncategorized';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Transactions & Ledger
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Real-time categorized ledger with automated balance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsAddTransactionOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards: 2-Cols on mobile, 4-Cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="card-fintech p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Inflow</span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-base sm:text-xl font-bold text-slate-900 font-numeric truncate">
            {formatCurrency(totalInflow)}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Credits</p>
        </div>

        <div className="card-fintech p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Outflow</span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-base sm:text-xl font-bold text-slate-900 font-numeric truncate">
            {formatCurrency(totalOutflow)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Debits</p>
        </div>

        <div className="card-fintech p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Net Surplus</span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-base sm:text-xl font-bold text-teal-800 font-numeric truncate">
            {netBalance >= 0 ? `+${formatCurrency(netBalance)}` : formatCurrency(netBalance)}
          </div>
          <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Net balance</p>
        </div>

        <div className="card-fintech p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Records</span>
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-base sm:text-xl font-bold text-slate-900 font-numeric">
            {transactionsTotal}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Database items</p>
        </div>
      </div>

      {/* Error state alert */}
      {transactionsError && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{transactionsError}</span>
          </div>
          <button
            onClick={() => fetchFilteredTransactions(currentPage, searchQuery, activeTab, selectedCategory, selectedAccount)}
            className="flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Table & Filter Controls */}
      <div className="card-fintech p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Tabs: Horizontal scrollable on mobile */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 overflow-x-auto no-scrollbar shrink-0">
            {(['all', 'expense', 'income', 'transfer'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  "rounded-lg px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold capitalize transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'expense'
                  ? 'Expenses'
                  : tab === 'income'
                  ? 'Income'
                  : 'Transfers'}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search merchant or description..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs overflow-x-auto no-scrollbar">
          <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0 text-[11px]">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-teal-600 focus:outline-none shrink-0"
          >
            <option value="All">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-teal-600 focus:outline-none shrink-0"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {(selectedCategory !== 'All' || selectedAccount !== 'All' || searchQuery || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedAccount('All');
                setActiveTab('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-teal-700 hover:text-teal-900 font-bold ml-1 underline whitespace-nowrap shrink-0 text-[11px]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transactions Container: Cards on Mobile (< md), Table on Desktop (md+) */}
      <div className="card-fintech overflow-hidden">
        {isLoadingTransactions ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-teal-700 mb-2" />
            <p className="font-semibold text-slate-600 text-xs">Loading ledger records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 px-4">
            <p className="font-semibold text-slate-700 text-sm">No transactions found.</p>
            <p className="text-xs text-slate-400 mt-1">
              Add a transaction or link an account to view ledger history.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Clean, tap-friendly card list (< md) */}
            <div className="divide-y divide-slate-100 block md:hidden">
              {transactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.account_id);
                const isIncome = tx.transaction_type === 'income';
                const isTransfer = tx.transaction_type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setViewingTx(tx)}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors active:bg-slate-100 cursor-pointer space-y-2"
                  >
                    {/* Top row: Date + Type / Category Pill */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        {formatDate(tx.transaction_date)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                          isIncome
                            ? "bg-emerald-50 text-emerald-700"
                            : isTransfer
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {tx.transaction_type}
                      </span>
                    </div>

                    {/* Middle row: Merchant Name & Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {tx.merchant || tx.description || (isTransfer ? 'Account Transfer' : 'Transaction')}
                        </p>
                        {tx.description && tx.merchant && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {tx.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-bold font-numeric text-sm shrink-0",
                          isIncome
                            ? "text-emerald-700"
                            : isTransfer
                            ? "text-blue-700"
                            : "text-slate-900"
                        )}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>

                    {/* Bottom row: Category badge + Account + Actions */}
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 font-medium",
                            tx.category
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700 italic border border-amber-200"
                          )}
                        >
                          {formatCategoryLabel(tx.category)}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {account ? account.name : 'Account'}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          aria-label="Edit transaction"
                          className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-200/60 rounded-md"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={isDeleting === tx.id}
                          onClick={() => handleDelete(tx.id)}
                          aria-label="Delete transaction"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 rounded-md disabled:opacity-50"
                        >
                          {isDeleting === tx.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Full Table (md+) */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-500">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Merchant / Description</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const account = accounts.find((a) => a.id === tx.account_id);
                    const isIncome = tx.transaction_type === 'income';
                    const isTransfer = tx.transaction_type === 'transfer';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setViewingTx(tx)}
                      >
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">
                            {tx.merchant || tx.description || (isTransfer ? 'Account Transfer' : 'Transaction')}
                          </span>
                          {tx.description && tx.merchant && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                              {tx.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 text-slate-400" />
                            <span>{account ? account.name : 'Primary Account'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-block rounded-lg px-2 py-0.5 font-medium text-[11px]",
                              tx.category
                                ? "bg-slate-100 text-slate-700"
                                : "bg-amber-50 text-amber-700 italic border border-amber-200"
                            )}
                          >
                            {formatCategoryLabel(tx.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                              isIncome
                                ? "bg-emerald-50 text-emerald-700"
                                : isTransfer
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-numeric font-bold">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-700'
                                : isTransfer
                                ? 'text-blue-700'
                                : 'text-slate-900'
                            }
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td
                          className="py-3 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              title="Edit transaction"
                              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={isDeleting === tx.id}
                              onClick={() => handleDelete(tx.id)}
                              title="Delete transaction"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isDeleting === tx.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white text-xs">
          <span className="text-slate-500 text-[11px] sm:text-xs">
            Showing{' '}
            <strong className="text-slate-800">
              {transactionsTotal === 0 ? 0 : (transactionsPage - 1) * transactionsPageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(transactionsPage * transactionsPageSize, transactionsTotal)}
            </strong>{' '}
            of <strong className="text-slate-800">{transactionsTotal}</strong>
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              disabled={transactionsPage <= 1 || isLoadingTransactions}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 sm:px-2 font-semibold text-slate-700 text-[11px] sm:text-xs">
              {transactionsPage}/{transactionsTotalPages || 1}
            </span>
            <button
              disabled={transactionsPage >= transactionsTotalPages || isLoadingTransactions}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {viewingTx && (
        <Dialog open={!!viewingTx} onOpenChange={(open) => !open && setViewingTx(null)}>
          <DialogContent className="w-[calc(100vw-28px)] max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Transaction Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 pt-2 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Amount</span>
                <span className={cn("text-xl sm:text-2xl font-bold font-numeric block mt-1", viewingTx.transaction_type === 'income' ? 'text-emerald-700' : 'text-slate-900')}>
                  {viewingTx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(viewingTx.amount)}
                </span>
                <span className="text-slate-700 font-bold text-xs sm:text-sm mt-0.5 block truncate">
                  {viewingTx.merchant || viewingTx.description || 'Transaction'}
                </span>
              </div>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewingTx.transaction_date)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-bold capitalize text-slate-800">{viewingTx.transaction_type}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800">{formatCategoryLabel(viewingTx.category)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-semibold text-slate-800 truncate ml-2">
                    {accounts.find((a) => a.id === viewingTx.account_id)?.name || viewingTx.account_id}
                  </span>
                </div>
                {viewingTx.description && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Notes:</span>
                    <span className="text-slate-800 truncate ml-2">{viewingTx.description}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setViewingTx(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
          <DialogContent className="w-[calc(100vw-28px)] max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit Transaction
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Merchant / Payee</label>
                <input
                  type="text"
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  placeholder="e.g. Swiggy, Amazon"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {CATEGORIES.filter((c) => c.value !== 'All').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Description / Note</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add note or memo..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingTx(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
