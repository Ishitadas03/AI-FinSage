export type StatementFormat = 'debit_credit' | 'signed_amount';

export type DuplicatePolicy = 'skip_duplicates' | 'abort_on_duplicate';

export interface RowValidationError {
  row_number: number;
  field?: string | null;
  error_message: string;
  raw_value?: string | null;
}

export interface DuplicateDetail {
  row_number: number;
  fingerprint: string;
  reason: string;
}

export interface NormalizedTransactionRow {
  transaction_date: string;
  description?: string | null;
  merchant?: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string | null;
  reference?: string | null;
  raw_row?: Record<string, any>;
}

export interface BankStatementPreviewResponse {
  filename: string;
  file_hash: string;
  detected_format?: StatementFormat | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  preview_count: number;
  has_more_preview_rows: boolean;
  normalized_rows: NormalizedTransactionRow[];
  validation_errors: RowValidationError[];
}

export interface BankStatementCommitParams {
  file: File;
  accountId: string;
  expectedFileHash: string;
  duplicatePolicy?: DuplicatePolicy;
  maxRows?: number;
}

export interface BankStatementImportCommitResponse {
  filename: string;
  file_hash: string;
  account_id: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  imported_rows: number;
  skipped_rows: number;
  duplicate_policy: DuplicatePolicy;
  validation_errors: RowValidationError[];
  duplicate_details: DuplicateDetail[];
}
