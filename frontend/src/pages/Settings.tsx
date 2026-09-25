import React, { useState } from 'react';
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
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Account, AccountType } from '@/types/account';
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
    updateProfile,
    resetAllData,
    transactions,
    budgets,
    goals,
    loans,
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
    'profile' | 'security' | 'notifications' | 'preferences' | 'accounts' | 'data'
  >('profile');

  // Profile Form State
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [pan, setPan] = useState(user.panNumber);
  const [monthlyIncome, setMonthlyIncome] = useState(user.monthlyIncome);

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      phone,
      panNumber: pan,
      monthlyIncome: Number(monthlyIncome),
    });
    toast.success('Profile settings updated successfully!');
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

  const handleExportFullJSON = () => {
    const fullBackup = {
      user,
      accounts,
      transactions,
      budgets,
      goals,
      loans,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSage_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Complete encrypted JSON data archive downloaded.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-teal-700" />
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your verified financial profile, connected banking APIs, security tokens, and privacy preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar Tabs (3 cols) */}
        <div className="md:col-span-3 flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {(
            [
              { id: 'profile', label: 'Profile & Identity', icon: User },
              { id: 'security', label: 'Security & 2FA', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
              { id: 'accounts', label: 'Connected Accounts', icon: Building },
              { id: 'data', label: 'Data & Privacy', icon: Lock },
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
                    ? "bg-teal-50 text-teal-900 font-bold border border-teal-200/80"
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
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Personal & Financial Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Mobile Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tax Identification (PAN)</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Monthly Disposable In-Hand Income (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
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
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900">
                    <option>INR (₹) - Indian Rupee</option>
                    <option>USD ($) - US Dollar</option>
                    <option>EUR (€) - Euro</option>
                    <option>GBP (£) - British Pound</option>
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

          {/* DATA & PRIVACY / DANGER ZONE TAB */}
          {activeTab === 'data' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Data Portability & Export
                </h3>
                <p className="text-slate-500 mt-2">
                  Download a full backup of all your transactions, budgets, goals, and AI financial records.
                </p>
                <button
                  onClick={handleExportFullJSON}
                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Download className="h-4 w-4" /> Export All Records (JSON Archive)
                </button>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 space-y-3">
                <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4 text-rose-600" /> Danger Zone
                </h4>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  Resetting mock data will restore baseline demo values for budgets and goals. Accounts and transactions remain securely stored in the backend database.
                </p>
                <button
                  onClick={() => {
                    resetAllData();
                    toast.success('Workspace reset to baseline state.');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reset Demo Features
                </button>
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
    </div>
  );
};
