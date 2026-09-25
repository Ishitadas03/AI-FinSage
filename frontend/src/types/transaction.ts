export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory =
  | 'salary'
  | 'food'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'rent'
  | 'entertainment'
  | 'healthcare'
  | 'education'
  | 'investment'
  | 'emi'
  | 'insurance'
  | 'cash'
  | 'other';

export interface ApiTransaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id?: string | null;
  amount: number;
  transaction_type: TransactionType;
  category?: TransactionCategory | null;
  merchant?: string | null;
  description?: string | null;
  reference?: string | null;
  source?: string | null;
  import_fingerprint?: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  account_id: string;
  destination_account_id?: string | null;
  amount: number;
  transaction_type: TransactionType;
  category?: TransactionCategory | null;
  merchant?: string | null;
  description?: string | null;
  reference?: string | null;
  source?: string | null;
  transaction_date: string;
}

export interface TransactionUpdate {
  account_id?: string;
  destination_account_id?: string | null;
  amount?: number;
  transaction_type?: TransactionType;
  category?: TransactionCategory | null;
  merchant?: string | null;
  description?: string | null;
  reference?: string | null;
  source?: string | null;
  transaction_date?: string;
}

export interface TransactionPaginatedResponse {
  items: ApiTransaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TransactionFilterParams {
  account_id?: string;
  transaction_type?: TransactionType;
  category?: TransactionCategory;
  merchant?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  page_size?: number;
}
