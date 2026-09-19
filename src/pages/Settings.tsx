import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Sliders,
  Palette,
  Lock,
  Building,
  Download,
  Trash2,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Settings: React.FC = () => {
  const { user, updateProfile, resetAllData, transactions, budgets, goals, loans } = useFinance();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences' | 'accounts' | 'data'>('profile');

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

  // Connected Accounts
  const [connectedAccounts, setConnectedAccounts] = useState([
    { id: 'acc-1', name: 'HDFC Bank Salary Account', number: '•••• 4892', status: 'Synced (10m ago)', type: 'Bank' },
    { id: 'acc-2', name: 'ICICI Sapphiro Credit Card', number: '•••• 1104', status: 'Synced (1h ago)', type: 'Credit Card' },
    { id: 'acc-3', name: 'Zerodha Kite Demat', number: '1849201', status: 'Synced (Today)', type: 'Investment' },
    { id: 'acc-4', name: 'Groww Mutual Funds', number: 'GRW-88392', status: 'Synced (Today)', type: 'Investment' },
  ]);

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

  const handleExportFullJSON = () => {
    const fullBackup = {
      user,
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
        <div className="md:col-span-3 space-y-1">
          {[
            { id: 'profile', label: 'Profile & Identity', icon: User },
            { id: 'security', label: 'Security & 2FA', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'preferences', label: 'System Preferences', icon: Sliders },
            { id: 'accounts', label: 'Connected Accounts', icon: Building },
            { id: 'data', label: 'Data & Privacy', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all text-left",
                  activeTab === tab.id
                    ? "bg-teal-50 text-teal-900 font-bold border border-teal-200/80"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4 w-4", activeTab === tab.id ? "text-teal-700" : "text-slate-400")} />
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

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Authentication & Security Guardrails
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
                    <p className="text-[11px] text-slate-500">Require TOTP authenticator prompt on each new device login.</p>
                  </div>
                  <button
                    onClick={() => {
                      setTwoFactor(!twoFactor);
                      toast.success(`2FA ${!twoFactor ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={cn("px-3 py-1 rounded-lg font-bold text-xs", twoFactor ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-600")}
                  >
                    {twoFactor ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">Biometric TouchID / Face Unlock</h4>
                    <p className="text-[11px] text-slate-500">Fast authentication for web sessions and approvals.</p>
                  </div>
                  <button
                    onClick={() => {
                      setBiometric(!biometric);
                      toast.success(`Biometrics ${!biometric ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={cn("px-3 py-1 rounded-lg font-bold text-xs", biometric ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-600")}
                  >
                    {biometric ? 'Enabled' : 'Disabled'}
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
            </div>
          )}

          {/* CONNECTED ACCOUNTS TAB */}
          {activeTab === 'accounts' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Connected Banking & Demat Feeds
                </h3>
                <button
                  onClick={() => toast.info('Account aggregator linking flow ready.')}
                  className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                >
                  <Plus className="h-3.5 w-3.5" /> Link New Bank Account
                </button>
              </div>

              <div className="space-y-2.5">
                {connectedAccounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-teal-700" />
                      <div>
                        <h4 className="font-bold text-slate-900">{acc.name}</h4>
                        <p className="text-[10px] text-slate-400">{acc.number} • {acc.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {acc.status}
                    </span>
                  </div>
                ))}
              </div>
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
                  Resetting mock data will restore Rahul Sharma's default ledger records. This action will clear custom additions.
                </p>
                <button
                  onClick={() => {
                    resetAllData();
                    toast.success('Workspace reset to baseline state.');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reset All Data to Baseline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
