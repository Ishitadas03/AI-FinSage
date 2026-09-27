import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/context/FinanceContext';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
  Building,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  BankStatementPreviewResponse,
  DuplicatePolicy,
} from '@/types/bankStatement';
import { cn } from '@/lib/utils';

interface ImportStatementModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultAccountId?: string;
}

export const ImportStatementModal: React.FC<ImportStatementModalProps> = ({
  isOpen,
  onClose,
  defaultAccountId,
}) => {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    accounts,
    previewBankStatement,
    commitBankStatement,
  } = useFinance();

  const modalOpen = isOpen !== undefined ? isOpen : isImportModalOpen;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BankStatementPreviewResponse | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId || '');
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip_duplicates');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Automatically select the first account or defaultAccountId when accounts load
  useEffect(() => {
    if (defaultAccountId) {
      setSelectedAccountId(defaultAccountId);
    } else if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, defaultAccountId]);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setErrorMessage(null);
    setIsLoadingPreview(false);
    setIsCommitting(false);
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
    setDuplicatePolicy('skip_duplicates');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetState();
      if (onClose) {
        onClose();
      }
    }
    setIsImportModalOpen(open);
  };

  const processFileSelection = async (file: File) => {
    setErrorMessage(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      const err = 'Invalid file type. Please upload a standard CSV file (.csv).';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    // Validate file size (max 4 MiB)
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      const err = `File size exceeds maximum allowed limit of 4MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`;
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (file.size === 0) {
      const err = 'The selected CSV file is empty.';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setSelectedFile(file);
    setIsLoadingPreview(true);

    try {
      const preview = await previewBankStatement(file);
      setPreviewData(preview);
      if (preview.valid_rows === 0) {
        setErrorMessage('No valid transaction rows could be parsed from this file. Please check the CSV format.');
      } else {
        toast.success(`Parsed ${preview.valid_rows} valid transaction entries.`);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to parse and preview the bank statement.');
      setErrorMessage(msg);
      toast.error(msg);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFileSelection(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleCommit = async () => {
    if (!selectedFile || !previewData) {
      toast.error('No statement preview data to commit.');
      return;
    }

    if (!selectedAccountId) {
      toast.error('Please select a destination account for the imported transactions.');
      return;
    }

    if (!previewData.file_hash) {
      toast.error('Preview verification hash is missing. Please re-upload the statement.');
      return;
    }

    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const result = await commitBankStatement({
        file: selectedFile,
        accountId: selectedAccountId,
        expectedFileHash: previewData.file_hash,
        duplicatePolicy,
      });

      const targetAcc = accounts.find((a) => a.id === selectedAccountId);
      const accName = targetAcc ? targetAcc.name : 'Account';

      toast.success(
        `Imported ${result.imported_rows} transaction${result.imported_rows !== 1 ? 's' : ''} into ${accName}! (${result.skipped_rows} skipped)`
      );

      handleModalClose(false);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to commit bank statement import.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-teal-700" />
              <span>Import Bank Statement</span>
            </div>
            {previewData && (
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {previewData.detected_format === 'debit_credit' ? 'Debit/Credit Columns' : 'Single Signed Amount'}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Import Notice</span>
                <p className="leading-relaxed text-[11px]">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Upload Dropzone when no preview data exists */}
          {!previewData ? (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                data-testid="csv-file-input"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div
                onClick={() => !isLoadingPreview && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px]",
                  isDragOver
                    ? "border-teal-600 bg-teal-50/40 scale-[0.99]"
                    : "border-slate-200 hover:border-teal-600 hover:bg-teal-50/20 bg-slate-50/40",
                  isLoadingPreview && "pointer-events-none opacity-60"
                )}
              >
                {isLoadingPreview ? (
                  <div className="space-y-3">
                    <RefreshCw className="h-10 w-10 text-teal-700 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-800">Parsing Bank Statement...</p>
                    <p className="text-xs text-slate-500">
                      Normalizing transaction dates, amounts, and inferring Indian merchant categories.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 mb-3 shadow-xs">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose or drag & drop CSV statement
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Supported formats: HDFC, ICICI, SBI, Axis, Zerodha, and standard Debit/Credit CSV ledgers (up to 4MB).
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: Preview & Configuration Workflow */
            <div className="space-y-5 text-xs">
              {/* File Info Strip */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{previewData.filename}</p>
                    <p className="text-[11px] text-slate-500">
                      {previewData.valid_rows} valid row{previewData.valid_rows !== 1 ? 's' : ''} •{' '}
                      {previewData.invalid_rows > 0 ? (
                        <span className="text-rose-600 font-semibold">{previewData.invalid_rows} invalid</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">All rows verified</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Destination Account Selection */}
              <div>
                <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <Building className="h-4 w-4 text-teal-700" />
                  <span>Destination Financial Account</span>
                </label>
                {accounts.length === 0 ? (
                  <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-800 text-[11px]">
                    No accounts found. Please add a bank account in Settings & Connected Accounts before committing.
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.account_type.replace('_', ' ').toUpperCase()}) — Balance:{' '}
                        {formatCurrency(acc.current_balance || acc.balance || 0)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Duplicate Handling Policy */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Duplicate Transaction Policy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all",
                      duplicatePolicy === 'skip_duplicates'
                        ? "border-teal-600 bg-teal-50/60 text-teal-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="dupPolicy"
                      value="skip_duplicates"
                      checked={duplicatePolicy === 'skip_duplicates'}
                      onChange={() => setDuplicatePolicy('skip_duplicates')}
                      className="mt-0.5 text-teal-700 focus:ring-0"
                    />
                    <div>
                      <span className="block text-xs font-bold">Skip Duplicates (Recommended)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Import unique rows and bypass entries already in your ledger.
                      </span>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all",
                      duplicatePolicy === 'abort_on_duplicate'
                        ? "border-teal-600 bg-teal-50/60 text-teal-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="dupPolicy"
                      value="abort_on_duplicate"
                      checked={duplicatePolicy === 'abort_on_duplicate'}
                      onChange={() => setDuplicatePolicy('abort_on_duplicate')}
                      className="mt-0.5 text-teal-700 focus:ring-0"
                    />
                    <div>
                      <span className="block text-xs font-bold">Abort on Duplicate</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Cancel entire import if any identical transaction hash is detected.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Validation Warnings (if any invalid rows) */}
              {previewData.validation_errors.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Info className="h-3.5 w-3.5" />
                    <span>{previewData.validation_errors.length} Row Validation Warning(s)</span>
                  </div>
                  {previewData.validation_errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-[10px] text-amber-800">
                      • Row {err.row_number}: {err.error_message} {err.raw_value ? `('${err.raw_value}')` : ''}
                    </p>
                  ))}
                  {previewData.validation_errors.length > 5 && (
                    <p className="text-[10px] font-bold text-amber-900">
                      ...and {previewData.validation_errors.length - 5} more skipped rows.
                    </p>
                  )}
                </div>
              )}

              {/* Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Normalized Transactions Preview (First {previewData.preview_count} of {previewData.valid_rows})</span>
                  <span>Amount</span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/40">
                  {previewData.normalized_rows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-white transition-colors">
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {row.merchant || row.description || 'Unspecified Payee'}
                          </span>
                          {row.category && (
                            <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-800 border border-teal-200/60 uppercase">
                              {row.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {formatDate(row.transaction_date)} • {row.description || row.reference || 'Bank Statement Entry'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "font-bold font-numeric text-xs block",
                            row.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                          )}
                        >
                          {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                        </span>
                        <span className="text-[9px] text-slate-400 capitalize">
                          {row.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
            <button
              type="button"
              disabled={isCommitting || isLoadingPreview}
              onClick={() => handleModalClose(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            {previewData && (
              <button
                type="button"
                disabled={!selectedFile || isCommitting || !selectedAccountId || previewData.valid_rows === 0}
                onClick={handleCommit}
                className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 transition-colors"
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Committing to Ledger...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Ingest {previewData.valid_rows} Rows</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
