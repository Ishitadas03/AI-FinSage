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
  Calendar,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  ArrowLeftRight,
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

  // Financial summary metrics based on loaded transactions
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Transactions & Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time categorized ledger integrated with backend accounts and balance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Import Statement</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddTransactionOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inflow (Current View)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalInflow)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Salary & credits</p>
        </div>

        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Outflow (Current View)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalOutflow)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Expenses & debits</p>
        </div>

        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Net Surplus</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            {netBalance >= 0 ? `+${formatCurrency(netBalance)}` : formatCurrency(netBalance)}
          </div>
          <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Net balance difference</p>
        </div>

        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Records</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {transactionsTotal}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Synced with database</p>
        </div>
      </div>

      {/* Error state alert */}
      {transactionsError && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
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

      {/* Table Controls: Tabs, Filters & Search */}
      <div className="card-fintech p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit">
            {(['all', 'expense', 'income', 'transfer'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all",
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by merchant or description..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="All">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.account_type})
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
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:border-teal-600 focus:outline-none"
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
              className="text-teal-700 hover:text-teal-900 font-semibold ml-2 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="card-fintech overflow-hidden">
        <div className="overflow-x-auto">
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
              {isLoadingTransactions ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-teal-700" />
                      <p className="font-semibold text-slate-600">Loading transactions from backend...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-700">No transactions found.</p>
                    <p className="text-[11px] mt-1">
                      Add a transaction or link an account to view ledger history.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
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
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {tx.merchant || tx.description || (isTransfer ? 'Account Transfer' : 'Transaction')}
                          </span>
                        </div>
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-white text-xs">
          <span className="text-slate-500">
            Showing{' '}
            <strong className="text-slate-800">
              {transactionsTotal === 0 ? 0 : (transactionsPage - 1) * transactionsPageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(transactionsPage * transactionsPageSize, transactionsTotal)}
            </strong>{' '}
            of <strong className="text-slate-800">{transactionsTotal}</strong> records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={transactionsPage <= 1 || isLoadingTransactions}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {transactionsPage} of {transactionsTotalPages || 1}
            </span>
            <button
              disabled={transactionsPage >= transactionsTotalPages || isLoadingTransactions}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {viewingTx && (
        <Dialog open={!!viewingTx} onOpenChange={(open) => !open && setViewingTx(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Transaction Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Amount</span>
                <span className={cn("text-2xl font-bold font-numeric block mt-1", viewingTx.transaction_type === 'income' ? 'text-emerald-700' : 'text-slate-900')}>
                  {viewingTx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(viewingTx.amount)}
                </span>
                <span className="text-slate-600 font-semibold text-sm mt-1 block">
                  {viewingTx.merchant || viewingTx.description || 'Transaction'}
                </span>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-slate-700 text-[10px]">{viewingTx.id}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewingTx.transaction_date)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-bold capitalize text-slate-800">{viewingTx.transaction_type}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800">{formatCategoryLabel(viewingTx.category)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Source Account:</span>
                  <span className="font-semibold text-slate-800">
                    {accounts.find((a) => a.id === viewingTx.account_id)?.name || viewingTx.account_id}
                  </span>
                </div>
                {viewingTx.destination_account_id && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Destination Account:</span>
                    <span className="font-semibold text-slate-800">
                      {accounts.find((a) => a.id === viewingTx.destination_account_id)?.name || viewingTx.destination_account_id}
                    </span>
                  </div>
                )}
                {viewingTx.description && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Description:</span>
                    <span className="text-slate-800">{viewingTx.description}</span>
                  </div>
                )}
                {viewingTx.source && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Source:</span>
                    <span className="text-slate-600 font-mono text-[10px]">{viewingTx.source}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit Transaction
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit && <RefreshCw className="h-3 w-3 animate-spin" />}
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
