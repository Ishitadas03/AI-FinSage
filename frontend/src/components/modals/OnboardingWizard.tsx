import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Shield,
  Target,
  CreditCard,
  User,
  Zap,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export const OnboardingWizard: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, user, updateProfile } = useFinance();
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: user.name || 'Rahul Sharma',
    email: user.email || 'rahul.sharma@finsage.io',
    income: 85000,
    expenses: 54200,
    savings: 1240000,
    hasLoans: true,
    loanAmount: 2180000,
    monthlyEmi: 23800,
    primaryGoal: 'Emergency Fund & Wealth Accumulation',
    targetGoalAmount: 5000000,
    riskAppetite: 'Moderate' as 'Conservative' | 'Moderate' | 'Aggressive',
  });

  const totalSteps = 7;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      // Finish onboarding
      updateProfile({
        name: formData.name,
        email: formData.email,
        monthlyIncome: formData.income,
        riskAppetite: formData.riskAppetite,
      });
      setIsOnboardingOpen(false);
      setStep(1);
      toast.success('Financial profile calibrated and AI engines initialized!');
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-dropdown">
        {/* Top Progress Bar */}
        <div className="bg-slate-100 h-1.5 w-full">
          <div
            className="bg-teal-700 h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-4 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-4 sm:mb-6">
            <span>Step {step} of {totalSteps}</span>
            <span className="text-teal-700 font-bold">
              {Math.round((step / totalSteps) * 100)}% Completed
            </span>
          </div>

          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <img src="/images/finsage-emblem.png" alt="FinSage" className="h-16 w-16 object-contain" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Welcome to FinSage
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your AI-powered financial copilot designed to eliminate money stress, optimize cash flow, shield against fraud, and compound your wealth.
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-left space-y-2 mt-4">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>Personalized cash flow forecasting</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>Real-time Scam Shield & transaction fraud detection</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>Explainable AI suggestions without speculative risk</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Monthly Income */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">What is your monthly in-hand income?</h3>
                  <p className="text-xs text-slate-500">Include primary salary, business, and regular passive income.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700">Monthly Income (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-teal-700 font-medium">
                  Formatted: {formatCurrency(formData.income)} / month
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Average Expenses */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">What are your average monthly expenses?</h3>
                  <p className="text-xs text-slate-500">Rent, groceries, utilities, dining, subscriptions, and shopping.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700">Monthly Expenses (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-medium">Estimated Monthly Savings:</span>
                  <strong className="text-emerald-900 font-bold">
                    {formatCurrency(formData.income - formData.expenses)} (
                    {Math.round(((formData.income - formData.expenses) / formData.income) * 100)}%)
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Current Savings */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Current liquid savings & investments?</h3>
                  <p className="text-xs text-slate-500">Bank accounts, FDs, mutual funds, stocks, and provident fund.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700">Total Liquid Net Worth (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={formData.savings}
                    onChange={(e) => setFormData({ ...formData, savings: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Provides a { (formData.savings / (formData.expenses || 1)).toFixed(1) } month emergency safety cushion.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Loans & EMIs */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Do you currently have active loans or EMIs?</h3>
                  <p className="text-xs text-slate-500">Home loan, vehicle loan, student loan, or personal loan.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasLoans: true })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.hasLoans
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Yes, I have active EMIs</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Track payoff & prepayments</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasLoans: false, monthlyEmi: 0, loanAmount: 0 })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !formData.hasLoans
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">No debt / EMIs</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">100% debt-free profile</p>
                </button>
              </div>

              {formData.hasLoans && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Total Monthly EMI Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.monthlyEmi}
                      onChange={(e) => setFormData({ ...formData, monthlyEmi: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Financial Goals */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">What is your primary financial goal?</h3>
                  <p className="text-xs text-slate-500">We will tailor your Future Self projections around this.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  'Build 6-Month Emergency Fund',
                  'Buy a New Home or Car',
                  'Early Financial Freedom & Retirement',
                  'International Vacation & Travel',
                ].map((g) => (
                  <div
                    key={g}
                    onClick={() => setFormData({ ...formData, primaryGoal: g })}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.primaryGoal === g
                        ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">{g}</span>
                    {formData.primaryGoal === g && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Complete Profile */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Your FinSage Profile</h3>
                  <p className="text-xs text-slate-500">Ready to build your bespoke financial intelligence dashboard.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 divide-y divide-slate-100 text-xs space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">User Name:</span>
                  <strong className="text-slate-900">{formData.name}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Monthly Inflow:</span>
                  <strong className="text-slate-900">{formatCurrency(formData.income)}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Monthly Expenses:</span>
                  <strong className="text-slate-900">{formatCurrency(formData.expenses)}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Liquid Savings:</span>
                  <strong className="text-emerald-700">{formatCurrency(formData.savings)}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Primary Goal:</span>
                  <strong className="text-teal-700">{formData.primaryGoal}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all"
            >
              <span>{step === totalSteps ? 'Build My Financial Profile' : 'Continue'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
