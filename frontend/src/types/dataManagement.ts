/**
 * FinSage Phase 5: Account & Data Management Type Definitions.
 */

export interface ApiUserProfile {
  id: string;
  full_name: string;
  email: string;
  clerk_user_id?: string | null;
  phone?: string | null;
  pan_number?: string | null;
  currency: string;
  monthly_income?: number | null;
  risk_appetite: string;
  preferences?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export type UserProfileResponse = ApiUserProfile;

export interface UserProfileUpdate {
  phone?: string | null;
  pan_number?: string | null;
  currency?: string;
  monthly_income?: number | null;
  risk_appetite?: string;
  preferences?: Record<string, any> | null;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  category: string;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  total: number;
}

export interface UserDeleteRequest {
  confirm_email: string;
  confirmation_text: string;
  reason?: string | null;
}

export interface AccountDeletionResponse {
  status: string;
  message: string;
  deleted_at: string;
  deleted_user_id: string;
}

export interface DataExportMetadata {
  exported_at: string;
  user_id: string;
  email: string;
  format: string;
  app_version: string;
  total_records: number;
}

export interface UserDataExportResponse {
  metadata: DataExportMetadata;
  profile: Record<string, any>;
  accounts: Record<string, any>[];
  transactions: Record<string, any>[];
  budgets: Record<string, any>[];
  goals: Record<string, any>[];
  loans: Record<string, any>[];
  recurring_bills: Record<string, any>[];
  notifications: Record<string, any>[];
}
