import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const Transactions: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    editTransaction,
    setIsAddTransactionOpen,
    setIsImportModalOpen,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit / Details Modal State
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'income' && tx.type !== 'income') return false;
      if (activeTab === 'expense' && tx.type !== 'expense') return false;

      // Category filter
      if (selectedCategory !== 'All' && tx.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== 'All' && tx.status !== selectedStatus.toLowerCase()) return false;

      // Payment method filter
      if (selectedPayment !== 'All' && tx.paymentMethod !== selectedPayment) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.merchant.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.paymentMethod.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [transactions, activeTab, selectedCategory, selectedStatus, selectedPayment, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Financial summary metrics
  const totalInflow = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalOutflow = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalInflow - totalOutflow;
  const flaggedCount = transactions.filter((t) => t.status === 'flagged').length;

  const categories = ['All', 'Housing', 'Food', 'Transport', 'Shopping', 'Subscriptions', 'Income', 'Others'];
  const paymentMethods = ['All', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Auto-Debit', 'Cash'];
  const statuses = ['All', 'Cleared', 'Pending', 'Flagged'];

  const handleExportCSV = () => {
    const headers = 'ID,Date,Merchant,Category,Type,Amount,Status,PaymentMethod,Notes\n';
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.merchant}","${t.category}","${t.type}",${t.amount},"${t.status}","${t.paymentMethod}","${t.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSage_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Transactions exported to CSV!');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    editTransaction(editingTx.id, {
      merchant: editingTx.merchant,
      amount: Number(editingTx.amount),
      category: editingTx.category,
      paymentMethod: editingTx.paymentMethod,
      notes: editingTx.notes,
    });
    toast.success('Transaction updated successfully.');
    setEditingTx(null);
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
            Real-time categorized ledger with automated bank feed reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            <span className="text-xs font-semibold text-slate-500">Total Inflow</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalInflow)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Salary & freelance credits</p>
        </div>

        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Outflow</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-numeric">
            {formatCurrency(totalOutflow)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Fixed & variable spends</p>
        </div>

        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Net Surplus</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-teal-800 font-numeric">
            +{formatCurrency(netBalance)}
          </div>
          <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Available for compounding</p>
        </div>

        <div className="card-fintech p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Flagged For Review</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600 font-numeric">
            {flaggedCount} Anomalies
          </div>
          <p className="text-[11px] text-rose-500 font-medium mt-0.5">Scam Shield active</p>
        </div>
      </div>

      {/* Table Controls: Tabs, Filters & Search */}
      <div className="card-fintech p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit">
            {(['all', 'expense', 'income'] as const).map((tab) => (
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
                {tab === 'all' ? 'All Transactions' : tab === 'expense' ? 'Expenses' : 'Income'}
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
              placeholder="Search by merchant, category, notes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>

          <select
            value={selectedPayment}
            onChange={(e) => {
              setSelectedPayment(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            {paymentMethods.map((p) => (
              <option key={p} value={p}>Payment: {p}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>Status: {s}</option>
            ))}
          </select>

          {(selectedCategory !== 'All' || selectedPayment !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedPayment('All');
                setSelectedStatus('All');
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
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-700">No transactions match your filter criteria.</p>
                    <p className="text-[11px] mt-1">Try broadening your search or resetting filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setViewingTx(tx)}
                  >
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{tx.merchant}</span>
                        {tx.isRecurring && (
                          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                            Recurring
                          </span>
                        )}
                      </div>
                      {tx.riskReason && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> {tx.riskReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                          tx.status === 'cleared'
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === 'flagged'
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-numeric font-bold">
                      <span
                        className={
                          tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                        }
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingTx(tx)}
                          title="Edit transaction"
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            deleteTransaction(tx.id);
                            toast.success('Transaction removed.');
                          }}
                          title="Delete transaction"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-white text-xs">
          <span className="text-slate-500">
            Showing{' '}
            <strong className="text-slate-800">
              {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
            </strong>{' '}
            of <strong className="text-slate-800">{filteredTransactions.length}</strong> records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
                <span className={cn("text-2xl font-bold font-numeric block mt-1", viewingTx.type === 'income' ? 'text-emerald-700' : 'text-slate-900')}>
                  {viewingTx.type === 'income' ? '+' : '-'}{formatCurrency(viewingTx.amount)}
                </span>
                <span className="text-slate-600 font-semibold text-sm mt-1 block">{viewingTx.merchant}</span>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-slate-700">{viewingTx.id}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewingTx.date)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800">{viewingTx.category}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{viewingTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-700 capitalize">{viewingTx.status}</span>
                </div>
                {viewingTx.notes && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Notes:</span>
                    <span className="text-slate-800">{viewingTx.notes}</span>
                  </div>
                )}
                {viewingTx.riskReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 mt-2">
                    <strong className="block text-[11px] font-bold flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> Scam Shield Audit Flag
                    </strong>
                    <p className="mt-1">{viewingTx.riskReason}</p>
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
                <label className="font-semibold text-slate-700">Merchant</label>
                <input
                  type="text"
                  required
                  value={editingTx.merchant}
                  onChange={(e) => setEditingTx({ ...editingTx, merchant: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={editingTx.category}
                    onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Notes</label>
                <input
                  type="text"
                  value={editingTx.notes || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, notes: e.target.value })}
                  placeholder="Add note..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
