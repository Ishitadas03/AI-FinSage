import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/context/FinanceContext';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const ImportStatementModal: React.FC = () => {
  const { isImportModalOpen, setIsImportModalOpen, importTransactions } = useFinance();
  const [fileSelected, setFileSelected] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const sampleParsedTransactions = [
    { merchant: "BigBasket Supermarket", category: "Food", amount: 2340, type: "expense" as const, date: "2026-09-19", paymentMethod: "UPI" as const, status: "cleared" as const },
    { merchant: "Fuel Station IndianOil", category: "Transport", amount: 1800, type: "expense" as const, date: "2026-09-18", paymentMethod: "Credit Card" as const, status: "cleared" as const },
    { merchant: "Freelance Client Dividend", category: "Income", amount: 12500, type: "income" as const, date: "2026-09-17", paymentMethod: "Net Banking" as const, status: "cleared" as const },
    { merchant: "BookMyShow Movies", category: "Shopping", amount: 840, type: "expense" as const, date: "2026-09-16", paymentMethod: "UPI" as const, status: "cleared" as const },
  ];

  const handleSimulatedUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      importTransactions(sampleParsedTransactions);
      setIsProcessing(false);
      setIsImportModalOpen(false);
      setFileSelected(null);
      toast.success(`Successfully imported 4 transactions from HDFC_Statement.csv!`);
    }, 800);
  };

  return (
    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-teal-700" />
            Import Bank Statement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!fileSelected ? (
            <div
              onClick={() => setFileSelected("HDFC_Bank_Statement_Sep2026.csv")}
              className="border-2 border-dashed border-slate-200 hover:border-teal-600 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-teal-50/20 group"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition-colors">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800">
                Click to choose or drag & drop CSV statement
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports HDFC, ICICI, SBI, Axis, Zerodha, and standard CSV ledgers
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-teal-50 p-3.5 border border-teal-200">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-5 w-5 text-teal-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{fileSelected}</p>
                    <p className="text-[11px] text-teal-800 font-medium">4 ledger entries detected & normalized</p>
                  </div>
                </div>
                <button
                  onClick={() => setFileSelected(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Change
                </button>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 flex justify-between">
                  <span>Detected Transactions Preview</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {sampleParsedTransactions.map((tx, idx) => (
                    <div key={idx} className="flex justify-between px-3 py-2">
                      <div>
                        <p className="font-semibold text-slate-800">{tx.merchant}</p>
                        <p className="text-[10px] text-slate-400">{tx.category} • {tx.paymentMethod}</p>
                      </div>
                      <span className={tx.type === 'income' ? 'text-emerald-700 font-bold' : 'text-slate-900 font-bold'}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!fileSelected || isProcessing}
              onClick={handleSimulatedUpload}
              className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-40 transition-colors"
            >
              <span>{isProcessing ? 'Processing...' : 'Confirm & Ingest'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
