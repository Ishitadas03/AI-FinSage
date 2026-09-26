export type BudgetPeriod = 'monthly' | 'weekly';

export type BudgetCategory =
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

export interface BudgetSpendingSummary {
  budget_id?: string | null;
  budget_name?: string | null;
  category: string;
  start_date: string;
  end_date: string;
  budget_amount: number;
  actual_spending: number;
  remaining_amount: number;
  over_budget_amount: number;
  spending_percentage: number;
  status: 'healthy' | 'warning' | 'over_budget';
}

export interface ApiBudget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  spending: BudgetSpendingSummary;
}

export interface BudgetCreate {
  name: string;
  category: string;
  amount: number;
  period?: BudgetPeriod;
  start_date: string;
  end_date: string;
}

export interface BudgetUpdate {
  name?: string;
  category?: string;
  amount?: number;
  period?: BudgetPeriod;
  start_date?: string;
  end_date?: string;
}

export interface BudgetFilterParams {
  category?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}
