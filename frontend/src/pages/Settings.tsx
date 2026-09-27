import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Sliders,
  Building,
  Lock,
  Download,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  LogOut,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileCode2,
  Activity,
  AlertOctagon,
  KeyRound,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Account, AccountType } from '@/types/account';
import { AuditLogEntry } from '@/types/dataManagement';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ACCOUNT_TYPES: { label: string; value: AccountType }[] = [
  { label: 'Savings Account', value: 'savings' },
  { label: 'Current Account', value: 'current' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Investment / Demat', value: 'investment' },
  { label: 'Cash Wallet', value: 'cash' },
  { label: 'Other', value: 'other' },
];

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    apiProfile,
    isLoadingProfile,
    profileError,
    loadProfile,
    updateProfile,
    exportDataJson,
    exportDataCsvZip,
    loadAuditLogs,
    deleteUserAccount,
    resetAllData,
    logout,
    accounts,
    isLoadingAccounts,
    accountsError,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'notifications' | 'preferences' | 'accounts' | 'data' | 'audit'
  >('profile');

  // Profile Form State
  const [phone, setPhone] = useState(user.phone || '');
  const [pan, setPan] = useState(user.panNumber || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user.monthlyIncome || 85000);
  const [currency, setCurrency] = useState(user.currency || 'INR');
  const [riskAppetite, setRiskAppetite] = useState(user.riskAppetite || 'Moderate');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state when persistent apiProfile loads
  useEffect(() => {
    if (apiProfile) {
      setPhone(apiProfile.phone || '');
      setPan(apiProfile.pan_number || '');
      setMonthlyIncome(apiProfile.monthly_income ? Number(apiProfile.monthly_income) : 85000);
      setCurrency(apiProfile.currency || 'INR');
      setRiskAppetite(apiProfile.risk_appetite || 'Moderate');
    }
  }, [apiProfile]);

  // Load initial persistent profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Security toggles
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometric, setBiometric] = useState(true);

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [scamAlerts, setScamAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Account Modals State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>('savings');
  const [newAccountBalance, setNewAccountBalance] = useState('0');
  const [newAccountCreditLimit, setNewAccountCreditLimit] = useState('');
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Export State
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);

  // Account Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('Closing account');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const fetchAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    try {
      const res = await loadAuditLogs(50, 0);
      setAuditLogs(res.logs || []);
      setAuditLogsTotal(res.total || 0);
    } catch {
      toast.error('Failed to load audit records.');
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const ok = await updateProfile({
        phone: phone.trim() || undefined,
        panNumber: pan.trim().toUpperCase() || undefined,
        monthlyIncome: Number(monthlyIncome) || undefined,
        currency,
        riskAppetite: riskAppetite as any,
      });
      if (ok) {
        toast.success('Application profile updated successfully.');
      } else {
        toast.error('Could not save profile changes.');
      }
    } catch {
      toast.error('An unexpected error occurred while saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportJson = async () => {
    setIsExportingJson(true);
    try {
      const data = await exportDataJson();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinSage_Ledger_Export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Complete JSON financial archive exported successfully.');
    } catch {
      toast.error('Failed to export JSON financial ledger.');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportCsvZip = async () => {
    setIsExportingCsv(true);
    try {
      const blob = await exportDataCsvZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinSage_Ledger_Tables_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Multi-table CSV Zip archive generated and downloaded.');
    } catch {
      toast.error('Failed to export CSV financial archive.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExecuteAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      toast.error('Confirmation email does not match your active account email.');
      return;
    }
    if (deleteConfirmText.trim() !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount({
        confirm_email: deleteConfirmEmail.trim(),
        confirmation_text: deleteConfirmText.trim(),
        reason: deleteReason,
      });
      toast.success('Your account and financial records have been permanently deleted.');
      setIsDeleteModalOpen(false);
      navigate('/signin');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) {
      toast.error('Please provide an account name.');
      return;
    }

    setIsSubmittingAccount(true);
    try {
      await createAccount({
        name: newAccountName.trim(),
        account_type: newAccountType,
        balance: Number(newAccountBalance) || 0,
        credit_limit:
          newAccountType === 'credit_card' && newAccountCreditLimit
            ? Number(newAccountCreditLimit)
            : null,
        currency: 'INR',
      });
      toast.success(`Account "${newAccountName}" added successfully.`);
      setIsAddAccountOpen(false);
      setNewAccountName('');
      setNewAccountBalance('0');
      setNewAccountCreditLimit('');
      setNewAccountType('savings');
    } catch {
      toast.error('Failed to create account.');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !newAccountName.trim()) return;

    setIsSubmittingAccount(true);
    try {
      await updateAccount(editingAccount.id, {
        name: newAccountName.trim(),
        credit_limit:
          editingAccount.account_type === 'credit_card' && newAccountCreditLimit
            ? Number(newAccountCreditLimit)
            : undefined,
      });
      toast.success('Account updated successfully.');
      setEditingAccount(null);
      setNewAccountName('');
    } catch {
      toast.error('Failed to update account.');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string, accName: string) => {
    setDeletingAccountId(id);
    try {
      const success = await deleteAccount(id);
      if (success) {
        toast.success(`Account "${accName}" removed.`);
      } else {
        toast.error('Failed to delete account.');
      }
    } finally {
      setDeletingAccountId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-teal-700" />
          Settings & Account Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your verified financial profile, connected banking APIs, audit trails, and data sovereignty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar Tabs (3 cols) */}
        <div className="md:col-span-3 flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {(
            [
              { id: 'profile', label: 'Profile & Identity', icon: User },
              { id: 'accounts', label: 'Connected Accounts', icon: Building },
              { id: 'security', label: 'Security & 2FA', icon: Shield },
              { id: 'data', label: 'Data & Privacy', icon: Lock },
              { id: 'audit', label: 'Audit Trail', icon: Activity },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 md:w-full items-center gap-2 md:gap-3 rounded-xl px-3 py-2 md:px-3.5 md:py-2.5 text-xs font-semibold transition-all text-left whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", activeTab === tab.id ? "text-teal-700" : "text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content (9 cols) */}
        <div className="md:col-span-9 card-fintech p-6 space-y-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Application Profile & Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your financial parameters and application-managed identity settings.
                  </p>
                </div>
                {isLoadingProfile && (
                  <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
                )}
              </div>

              {profileError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  {profileError}
                </div>
              )}

              {/* Trusted Clerk Identity (Read-Only) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-teal-700" />
                    Verified Authentication Identity
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                    Clerk Managed
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Full Name
                    </span>
                    <span className="font-semibold text-slate-900 text-xs">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Primary Email
                    </span>
                    <span className="font-semibold text-slate-900 text-xs">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Application-Managed Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-phone-input" className="font-semibold text-slate-700">Phone Number</label>
                  <input
                    id="settings-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="settings-pan-input" className="font-semibold text-slate-700">PAN / Tax ID</label>
                  <input
                    id="settings-pan-input"
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-income-input" className="font-semibold text-slate-700">Monthly Disposable In-Hand Income (₹)</label>
                  <input
                    id="settings-income-input"
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="settings-risk-select" className="font-semibold text-slate-700">Risk Profile & Appetite</label>
                  <select
                    id="settings-risk-select"
                    value={riskAppetite}
                    onChange={(e) => setRiskAppetite(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Conservative">Conservative (Capital Preservation)</option>
                    <option value="Moderate">Moderate (Balanced Growth)</option>
                    <option value="Aggressive">Aggressive (High Return / Equity)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="settings-currency-select" className="font-semibold text-slate-700">Primary Ledger Currency</label>
                <select
                  id="settings-currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingProfile && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* DATA & PRIVACY TAB (Phase 5) */}
          {activeTab === 'data' && (
            <div className="space-y-6 text-xs">
              {/* Export Section */}
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Download className="h-4 w-4 text-teal-700" />
                    Data Portability & Complete Financial Export
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    Download a complete, user-isolated snapshot of your personal financial records.
                  </p>
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Exports contain your complete financial ledger: connected accounts, transactions, categorization metadata, budgets, financial goals, active loans/EMIs, recurring bills, and notifications.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleExportJson}
                    disabled={isExportingJson}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-300 transition-all text-left shadow-sm disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                        <FileCode2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Structured JSON Export</h4>
                        <p className="text-[10px] text-slate-500">Machine-readable full data backup</p>
                      </div>
                    </div>
                    {isExportingJson ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-teal-700" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={handleExportCsvZip}
                    disabled={isExportingCsv}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-300 transition-all text-left shadow-sm disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Multi-Table CSV Archive</h4>
                        <p className="text-[10px] text-slate-500">ZIP with accounts, txns, budgets</p>
                      </div>
                    </div>
                    {isExportingCsv ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-teal-700" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Data Retention Policy */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-teal-700" />
                  Data Privacy & Retention Policy
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  FinSage enforces tenant isolation on all queries. Financial records are encrypted at rest and in transit. Security audit logs are immutable and isolated to prevent tampering.
                </p>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 space-y-3">
                <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4 text-rose-600" /> Permanent Account & Data Deletion
                </h4>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  Permanently erase your user profile, all connected accounts, transactions, budgets, goals, loans, and recurring commitments from the FinSage database. This operation is strictly irreversible.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 shadow-sm transition-colors text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete My FinSage Account
                  </button>
                  <button
                    onClick={() => {
                      resetAllData();
                      toast.success('Local demo view-models reset to baseline.');
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 font-semibold text-rose-700 hover:bg-rose-50 transition-colors text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Reset Local Demo Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT TRAIL TAB (Phase 5) */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-700" />
                    Security & Data Access Audit Trail
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Immutable security log of profile changes, data exports, and sensitive operations.
                  </p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  disabled={isLoadingAuditLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoadingAuditLogs && "animate-spin text-teal-700")} />
                  Refresh
                </button>
              </div>

              {isLoadingAuditLogs ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-teal-700 mb-2" />
                  <p className="font-semibold text-slate-600">Retrieving audit events...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Activity className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-bold text-slate-800 text-sm">No Audit Logs Found</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Sensitive operations like profile updates and data exports will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="capitalize text-slate-600 text-[11px]">
                              {log.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {log.details ? JSON.stringify(log.details) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONNECTED ACCOUNTS TAB */}
          {activeTab === 'accounts' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Connected Financial Accounts
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live bank, card, and investment ledger accounts synchronized with backend APIs.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 shadow-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Account
                </button>
              </div>

              {accountsError && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{accountsError}</span>
                  </div>
                  <button
                    onClick={() => loadAccounts()}
                    className="font-bold text-rose-700 hover:text-rose-900 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {isLoadingAccounts ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-teal-700 mb-2" />
                  <p className="font-semibold text-slate-600">Loading accounts from backend...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Wallet className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-bold text-slate-800 text-sm">No Accounts Connected</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Add your first bank account, credit card, or investment portfolio to begin tracking transactions.
                  </p>
                  <button
                    onClick={() => setIsAddAccountOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Account
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                          {acc.account_type === 'credit_card' ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <Building className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{acc.name}</h4>
                          <p className="text-[10px] text-slate-500 capitalize">
                            {acc.account_type.replace('_', ' ')} • {acc.currency}
                            {acc.credit_limit && (
                              <span> • Limit: {formatCurrency(acc.credit_limit)}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-bold font-numeric text-slate-900 text-xs block">
                            {formatCurrency(acc.current_balance || acc.balance || 0)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            Active
                          </span>
                        </div>

                        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                          <button
                            onClick={() => {
                              setEditingAccount(acc);
                              setNewAccountName(acc.name);
                              setNewAccountCreditLimit(
                                acc.credit_limit ? String(acc.credit_limit) : ''
                              );
                            }}
                            title="Edit account"
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-white rounded-lg transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={deletingAccountId === acc.id}
                            onClick={() => handleDeleteAccount(acc.id, acc.name)}
                            title="Delete account"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingAccountId === acc.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Security & Authentication
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">Two-Factor Authentication (TOTP / SMS)</h4>
                    <p className="text-[11px] text-slate-500">Require an OTP when signing in from unknown devices.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={() => setTwoFactor(!twoFactor)}
                    className="rounded text-teal-700 cursor-pointer h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">Biometric / Passkey Quick Login</h4>
                    <p className="text-[11px] text-slate-500">Authenticate using TouchID, FaceID, or Windows Hello.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={biometric}
                    onChange={() => setBiometric(!biometric)}
                    className="rounded text-teal-700 cursor-pointer h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">Sign Out of FinSage</h4>
                    <p className="text-[11px] text-slate-500">Sign out of your active session on this browser.</p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      toast.success('Signed out successfully.');
                      navigate('/signin');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Notification Preferences
              </h3>

              <div className="space-y-2.5">
                {[
                  { title: 'Real-Time Scam Shield & Fraud Alerts', state: scamAlerts, setter: setScamAlerts },
                  { title: 'Weekly AI Financial Progress Digest', state: weeklyReport, setter: setWeeklyReport },
                  { title: 'Instant Large Transaction Push Alerts (>₹10,000)', state: smsAlerts, setter: setSmsAlerts },
                  { title: 'Monthly Goal & Budget Milestone Notifications', state: emailAlerts, setter: setEmailAlerts },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={() => item.setter(!item.state)}
                      className="rounded text-teal-700 cursor-pointer h-4 w-4"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Localization & Display Formatting
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Numbering Format</label>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900">
                    <option>Indian (Lakhs & Crores - ₹12,40,000)</option>
                    <option>International (Millions - $1,240,000)</option>
                  </select>
                </div>
              </div>

              {/* PWA Mobile Application Install Card */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        FinSage Mobile App (PWA)
                        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-800">
                          Active
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Install FinSage on your Android, iOS, or Desktop home screen for fast offline-ready finance management.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <PWAInstallButton variant="primary" label="Install App Now" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Link New Financial Account
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateAccount} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Account Display Name</label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. HDFC Salary Account, ICICI Sapphiro"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Account Type</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Initial Balance (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  placeholder="₹ 0.00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {newAccountType === 'credit_card' && (
                <div>
                  <label className="font-semibold text-slate-700">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newAccountCreditLimit}
                    onChange={(e) => setNewAccountCreditLimit(e.target.value)}
                    placeholder="e.g. 150000"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAccount}
                  onClick={() => setIsAddAccountOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAccount}
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAccount && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Edit Account Details
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateAccount} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Account Display Name</label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {editingAccount.account_type === 'credit_card' && (
                <div>
                  <label className="font-semibold text-slate-700">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newAccountCreditLimit}
                    onChange={(e) => setNewAccountCreditLimit(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAccount}
                  onClick={() => setEditingAccount(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAccount}
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAccount && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Permanent Account Deletion Modal (Phase 5) */}
      {isDeleteModalOpen && (
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white border border-rose-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-900 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-600" />
                Permanent Account & Data Deletion
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleExecuteAccountDeletion} className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
                <p className="font-bold text-[11px]">
                  ⚠️ Warning: This action is permanent and cannot be reversed.
                </p>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  Deleting your account will immediately delete all your accounts, transactions, categorization data, budgets, goals, and recurring commitments.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">
                  1. Type your account email address (<span className="text-slate-900 font-bold">{user.email}</span>):
                </label>
                <input
                  type="email"
                  required
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">
                  2. Type <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">
                  3. Reason for leaving (optional):
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                >
                  <option value="Closing account">Closing account</option>
                  <option value="Switching to another app">Switching to another app</option>
                  <option value="Privacy concerns">Privacy concerns</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeletingAccount ||
                    deleteConfirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase() ||
                    deleteConfirmText.trim() !== 'DELETE MY ACCOUNT'
                  }
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isDeletingAccount && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Permanently Delete Everything</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
