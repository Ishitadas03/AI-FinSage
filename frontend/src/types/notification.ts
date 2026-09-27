export type NotificationType =
  | 'bill_upcoming'
  | 'bill_overdue'
  | 'bill_paid'
  | 'security'
  | 'goal'
  | 'insight'
  | 'budget_alert'
  | 'system';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unread_count: number;
}

export interface NotificationBatchMarkReadRequest {
  notification_ids?: string[];
}

export interface NotificationGenerateResponse {
  generated_count: number;
  message: string;
}
