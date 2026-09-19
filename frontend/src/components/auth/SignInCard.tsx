import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { SocialLoginButton } from './SocialLoginButton';
import { useFinance } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';

interface SignInCardProps {
  onSuccess?: () => void;
}

export const SignInCard: React.FC<SignInCardProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { login, user } = useFinance();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setIsLoading(true);

    // Simulate authenticating session
    setTimeout(() => {
      setIsLoading(false);
      const success = login(email.trim(), undefined, rememberMe);

      if (success) {
        toast.success(`Welcome back to FinSage!`);
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage('Email or password is incorrect. Please verify and try again.');
      }
    }, 600);
  };

  const handleSocialLogin = (provider: 'google' | 'microsoft' | 'github') => {
    toast.info(`Connecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)} secure login...`);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Automatically log in with a demo account for the chosen provider
      const providerEmail = `user.${provider}@finsage.io`;
      login(providerEmail, `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`, true);
      toast.success(`Signed in successfully via ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
      navigate('/dashboard');
    }, 800);
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

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Sign In Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-lg shadow-slate-900/4 space-y-6">
        
        {/* Card Header */}
        <div className="space-y-1.5 text-left">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Sign in to FinSage
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Welcome back! Please enter your details to continue.
          </p>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 animate-in fade-in-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Social Logins */}
        <div className="space-y-2.5">
          <SocialLoginButton
            provider="google"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
          />
          <SocialLoginButton
            provider="microsoft"
            onClick={() => handleSocialLogin('microsoft')}
            disabled={isLoading}
          />
          <SocialLoginButton
            provider="github"
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
          />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            or
          </span>
          <div className="w-full border-t border-slate-200" />
        </div>

        {/* Main Email/Password Form */}
        <form onSubmit={handleSignIn} className="space-y-4" noValidate>
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signin-email"
              className="block text-xs font-bold text-slate-700"
            >
              Email address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={cn(
                  'w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition-all',
                  'focus:outline-hidden focus:ring-2 focus:ring-teal-500/20',
                  errors.email
                    ? 'border-rose-400 focus:border-rose-600'
                    : 'border-slate-300 focus:border-teal-600'
                )}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-medium text-rose-600 animate-in fade-in-0">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="signin-password"
                className="block text-xs font-bold text-slate-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={cn(
                  'w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 transition-all',
                  'focus:outline-hidden focus:ring-2 focus:ring-teal-500/20',
                  errors.password
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
            {errors.password && (
              <p className="text-[11px] font-medium text-rose-600 animate-in fade-in-0">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded-md border-slate-300 text-teal-700 accent-teal-700 focus:ring-teal-500/20 cursor-pointer"
            />
            <label htmlFor="remember-me" className="text-xs cursor-pointer select-none">
              <span className="font-semibold text-slate-700 block">Remember me</span>
              <span className="text-[11px] text-slate-400 block">Keep me signed in on this device</span>
            </label>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 px-4 text-xs font-bold text-white shadow-md shadow-teal-900/10 transition-all',
                'hover:bg-teal-800 hover:shadow-lg active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-600/30',
                isLoading && 'opacity-80 cursor-wait'
              )}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="pt-2 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>Your financial information is handled with privacy in mind.</span>
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
                  We've sent a recovery link to <strong>{forgotEmail}</strong>.
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
