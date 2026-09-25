export type AccountType =
  | 'savings'
  | 'current'
  | 'cash'
  | 'credit_card'
  | 'investment'
  | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  balance: number;
  current_balance: number;
  credit_limit?: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  account_type: AccountType;
  balance?: number;
  credit_limit?: number | null;
  currency?: string;
}

export interface AccountUpdate {
  name?: string;
  account_type?: AccountType;
  balance?: number;
  credit_limit?: number | null;
  currency?: string;
}
