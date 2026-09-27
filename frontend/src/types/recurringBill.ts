export type RecurringBillFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual';

export type RecurringBillStatus = 'active' | 'paused' | 'cancelled';

export interface RecurringBill {
  id: string;
  user_id: string;
  account_id?: string | null;
  account_name?: string | null;
  name: string;
  merchant?: string | null;
  category: string;
  amount: number;
  frequency: RecurringBillFrequency;
  start_date: string;
  end_date?: string | null;
  next_due_date: string;
  status: RecurringBillStatus;
  auto_post: boolean;
  last_posted_date?: string | null;
  reminder_days_before: number;
  is_overdue?: boolean;
  days_until_due?: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringBillListResponse {
  items: RecurringBill[];
  total: number;
  active_count: number;
  monthly_committed_total: number;
}

export interface RecurringBillCreateRequest {
  name: string;
  merchant?: string | null;
  category?: string;
  amount: number;
  frequency?: RecurringBillFrequency;
  start_date: string;
  end_date?: string | null;
  account_id?: string | null;
  auto_post?: boolean;
  reminder_days_before?: number;
}

export interface RecurringBillUpdateRequest {
  name?: string;
  merchant?: string | null;
  category?: string;
  amount?: number;
  frequency?: RecurringBillFrequency;
  start_date?: string;
  end_date?: string | null;
  account_id?: string | null;
  status?: RecurringBillStatus;
  auto_post?: boolean;
  reminder_days_before?: number;
}

export interface RecurringBillPostPaymentRequest {
  account_id?: string | null;
  payment_date?: string | null;
  amount?: number | null;
  notes?: string | null;
}

export interface RecurringBillPaymentResult {
  message: string;
  transaction: Record<string, unknown>;
  bill: RecurringBill;
}
