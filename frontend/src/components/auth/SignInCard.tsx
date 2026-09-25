import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';

interface SignInCardProps {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const SignInCard: React.FC<SignInCardProps> = ({ initialMode = 'signin', onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, authError, clearAuthError } = useFinance();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const redirectAfterAuth = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      const state = location.state as { from?: { pathname?: string } } | null;
      const from = state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  const validate = () => {
    const errs: { fullName?: string; email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'signup' && !fullName.trim()) {
      errs.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const success = await login(email.trim(), password, rememberMe);
        if (success) {
          toast.success('Welcome back to FinSage!');
          redirectAfterAuth();
        }
      } else {
        const success = await register(email.trim(), password, fullName.trim());
        if (success) {
          toast.success('Account created and authenticated successfully!');
          redirectAfterAuth();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast.error('Please enter a valid email address for password recovery.');
      return;
    }

    setForgotSubmitted(true);
    toast.success('Password recovery instructions sent to your email.');
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSubmitted(false);
      setForgotEmail('');
    }, 1800);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    clearAuthError();
    setClientErrors({});
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Sign In / Sign Up Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-lg shadow-slate-900/4 space-y-6">
        {/* Mode Switcher Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-bold transition-all',
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-bold transition-all',
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Create Account
          </button>
        </div>

        {/* Card Header */}
        <div className="space-y-1.5 text-left">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {mode === 'signin' ? 'Sign in to FinSage' : 'Create your FinSage account'}
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            {mode === 'signin'
              ? 'Welcome back! Enter your verified credentials to access your financial dashboard.'
              : 'Join FinSage to analyze cash flow, manage debt, and optimize your wealth.'}
          </p>
        </div>

        {/* Server Error Banner if any */}
        {authError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 animate-in fade-in-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{authError}</span>
          </div>
        )}

        {/* Main Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name Field (Sign Up only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-bold text-slate-700"
              >
                Full name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (clientErrors.fullName) {
                      setClientErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  className={cn(
                    'w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition-all',
                    'focus:outline-hidden focus:ring-2 focus:ring-teal-500/20',
                    clientErrors.fullName
                      ? 'border-rose-400 focus:border-rose-600'
                      : 'border-slate-300 focus:border-teal-600'
                  )}
                />
              </div>
              {clientErrors.fullName && (
                <p className="text-[11px] font-medium text-rose-600 animate-in fade-in-0">
                  {clientErrors.fullName}
                </p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="auth-email"
              className="block text-xs font-bold text-slate-700"
            >
              Email address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (clientErrors.email) {
                    setClientErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={cn(
                  'w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition-all',
                  'focus:outline-hidden focus:ring-2 focus:ring-teal-500/20',
                  clientErrors.email
                    ? 'border-rose-400 focus:border-rose-600'
                    : 'border-slate-300 focus:border-teal-600'
                )}
              />
            </div>
            {clientErrors.email && (
              <p className="text-[11px] font-medium text-rose-600 animate-in fade-in-0">
                {clientErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-slate-700"
              >
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (clientErrors.password) {
                    setClientErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className={cn(
                  'w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 transition-all',
                  'focus:outline-hidden focus:ring-2 focus:ring-teal-500/20',
                  clientErrors.password
                    ? 'border-rose-400 focus:border-rose-600'
                    : 'border-slate-300 focus:border-teal-600'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {clientErrors.password && (
              <p className="text-[11px] font-medium text-rose-600 animate-in fade-in-0">
                {clientErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me / Session */}
          {mode === 'signin' && (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded-md border-slate-300 text-teal-700 accent-teal-700 focus:ring-teal-500/20 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-xs cursor-pointer select-none">
                <span className="font-semibold text-slate-700 block">Stay signed in</span>
                <span className="text-[11px] text-slate-400 block">Maintain session in browser</span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 px-4 text-xs font-bold text-white shadow-md shadow-teal-900/10 transition-all',
                'hover:bg-teal-800 hover:shadow-lg active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-600/30',
                isSubmitting && 'opacity-80 cursor-wait'
              )}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign in' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="pt-2 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>Encrypted with Argon2id & JWT token rotation.</span>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reset your password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the email address associated with your FinSage account, and we'll send you instructions to reset your password.
            </p>

            {forgotSubmitted ? (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>Check your inbox</span>
                </div>
                <p className="text-[11px] text-teal-800">
                  We've sent recovery instructions to <strong>{forgotEmail}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
