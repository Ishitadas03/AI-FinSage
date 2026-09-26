export type GoalType =
  | 'emergency_fund'
  | 'education'
  | 'travel'
  | 'vehicle'
  | 'home'
  | 'retirement'
  | 'investment'
  | 'purchase'
  | 'other';

export type GoalPriority = 'low' | 'medium' | 'high';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface GoalDerivedState {
  progress_percentage: number;
  remaining_amount: number;
  remaining_months: number;
  required_monthly_contribution?: number | null;
  is_overdue: boolean;
  is_on_track: boolean;
  contribution_total?: number | null;
  has_contribution_history: boolean;
}

export interface ApiGoal {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  goal_type: GoalType | string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: GoalPriority | string;
  status: GoalStatus | string;
  created_at: string;
  updated_at: string;
  derived_state: GoalDerivedState;
}

export interface GoalCreate {
  name: string;
  description?: string;
  goal_type: GoalType | string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  priority?: GoalPriority | string;
  status?: GoalStatus | string;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  goal_type?: GoalType | string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  priority?: GoalPriority | string;
  status?: GoalStatus | string;
}

export interface GoalFilterParams {
  status?: string;
  goal_type?: string;
  priority?: string;
  page?: number;
  page_size?: number;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  note?: string | null;
  created_at: string;
}

export interface GoalContributionCreate {
  amount: number;
  contribution_date: string;
  note?: string;
}
