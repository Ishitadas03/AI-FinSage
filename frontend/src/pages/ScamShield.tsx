import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Smartphone,
  Eye,
  Flag,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { SecurityAlert } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const ScamShield: React.FC = () => {
  const { securityAlerts, securityScore, markAlertSafe, reportAlert } = useFinance();
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Unauthorized transaction / fraudulent attempt');

  const pendingAlerts = securityAlerts.filter((a) => a.status === 'pending');
  const resolvedAlerts = securityAlerts.filter((a) => a.status !== 'pending');

  const handleMarkSafe = (alert: SecurityAlert) => {
    markAlertSafe(alert.id);
    toast.success(`Merchant '${alert.merchant}' marked as Safe & Verified.`);
    setSelectedAlert(null);
  };

  const handleReport = () => {
    if (!selectedAlert) return;
    reportAlert(selectedAlert.id, reportReason);
    toast.error(`Transaction reported. Automated block advisory issued for '${selectedAlert.merchant}'.`);
    setIsReportModalOpen(false);
    setSelectedAlert(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            Scam Shield & Fraud Defense
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time heuristic & behavioral cyber-defense guarding every bank card, UPI, and payment gateway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            <span>AI Shield Engine: Active & Monitoring</span>
          </div>
        </div>
      </div>

      {/* 4 Security Posture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Security Health Score</span>
          <div className="mt-2 text-2xl font-black text-slate-900 font-numeric">
            {securityScore} / 100
          </div>
          <p className="text-[11px] text-teal-700 font-semibold mt-1">
            {securityScore >= 80 ? 'Low Risk Exposure' : 'Action Required on Anomalies'}
          </p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Active High-Risk Anomalies</span>
          <div className="mt-2 text-2xl font-black text-rose-600 font-numeric">
            {pendingAlerts.length} Flagged
          </div>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Pending user verification</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">Verified Safe Merchants</span>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-numeric">
            142 Whitelisted
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Trusted payment paths</p>
        </div>

        <div className="card-fintech p-4">
          <span className="text-xs font-semibold text-slate-500">UPI Daily Limits</span>
          <div className="mt-2 text-2xl font-black text-slate-900 font-numeric">
            ₹25,000 / Day
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mandate protection locked</p>
        </div>
      </div>

      {/* Suspicious Transactions Action Feed */}
      <div className="card-fintech p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Flagged Suspicious Activity</h3>
            <p className="text-xs text-slate-400">
              Explainable AI audits highlighting WHY transactions were flagged
            </p>
          </div>
          {pendingAlerts.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 animate-pulse">
              {pendingAlerts.length} Urgent Review
            </span>
          )}
        </div>

        {pendingAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">All clear! No suspicious transactions detected.</p>
            <p className="mt-1">Scam Shield is monitoring all background payment channels.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 sm:p-5 space-y-3.5 transition-all hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{alert.merchant}</h4>
                      <p className="text-[11px] text-slate-500">{alert.date} • {alert.location}</p>
                    </div>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="text-base font-bold text-rose-600 font-numeric">
                      {formatCurrency(alert.amount)}
                    </span>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      Risk Score: {alert.riskScore}/100
                    </span>
                  </div>
                </div>

                {/* Explainable AI Reasons - Never Blackbox */}
                <div className="rounded-xl bg-white p-3 border border-rose-100 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Why FinSage Flagged This
                  </span>
                  {alert.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-700 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>View Risk Trace</span>
                  </button>

                  <button
                    onClick={() => handleMarkSafe(alert)}
                    className="flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Mark as Safe</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setIsReportModalOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Block & Report Scam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Best Practices Checklist */}
      <div className="card-fintech p-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lock className="h-4 w-4 text-teal-700" />
          Recommended Security Guardrails
        </h3>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Disable International Usage
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Keep international e-commerce disabled on debit cards when not traveling.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cap UPI Single Mandates
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Limit maximum single auto-debit authority on UPI apps to ₹5,000.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Review Active Autopays
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Audit recurring subscription tokens semi-annually to stop zombie drains.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Risk Analysis Modal */}
      {selectedAlert && !isReportModalOpen && (
        <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-rose-600" />
                Forensic Risk Telemetry
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-700">Risk Assessment</span>
                <div className="text-2xl font-black text-rose-900 font-numeric mt-0.5">
                  {selectedAlert.riskScore}/100 Confidence
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">{selectedAlert.merchant}</p>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100 text-slate-600">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Amount:</span>
                  <strong className="text-slate-900 font-numeric">{formatCurrency(selectedAlert.amount)}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Reported Geolocation:</span>
                  <span className="font-semibold text-slate-800">{selectedAlert.location}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Device Fingerprint:</span>
                  <span className="text-slate-800 font-mono text-[11px]">{selectedAlert.device}</span>
                </div>
                {selectedAlert.ipAddress && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Gateway IP:</span>
                    <span className="text-slate-800 font-mono text-[11px]">{selectedAlert.ipAddress}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Modal */}
      {isReportModalOpen && selectedAlert && (
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-dropdown">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Confirm Scam Report
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <p className="text-slate-600">
                Are you sure you want to report <strong>{selectedAlert.merchant}</strong> for <strong>{formatCurrency(selectedAlert.amount)}</strong>?
              </p>

              <div>
                <label className="font-semibold text-slate-700">Select Fraud Category</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option>Unauthorized transaction / fraudulent attempt</option>
                  <option>Fake e-commerce / counterfeit merchant</option>
                  <option>Phishing / social engineering trick</option>
                  <option>Rogue recurring subscription charge</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
                >
                  Confirm & Block
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
