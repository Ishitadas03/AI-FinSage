import React from 'react';
import { FinSageAuthLayout } from '@/components/auth/FinSageAuthLayout';
import { Navigate, useNavigate } from 'react-router-dom';
import { SignUp, useAuth } from '@clerk/react';
import { useFinance } from '@/context/FinanceContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { isAuthenticated } = useFinance();

  if ((isLoaded && isSignedIn) || isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <FinSageAuthLayout
      headerActionText="Already have an account?"
      headerButtonText="Sign In"
      onHeaderActionClick={() => navigate('/signin')}
    >
      <div className="w-full max-w-md mx-auto flex justify-center">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/signin"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full shadow-lg rounded-2xl overflow-hidden",
              card: "border border-slate-200/80 shadow-none rounded-2xl bg-white p-6 sm:p-8",
              headerTitle: "text-slate-900 font-bold text-xl tracking-tight",
              headerSubtitle: "text-slate-500 text-xs font-normal",
              socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all text-xs py-2.5",
              socialButtonsBlockButtonText: "font-semibold text-xs",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-400 text-xs",
              formFieldLabel: "text-xs font-semibold text-slate-700",
              formFieldInput: "rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-teal-700 text-xs py-2.5 transition-all text-slate-900",
              formButtonPrimary: "bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md",
              footerActionLink: "text-teal-800 hover:text-teal-900 font-bold text-xs",
              footer: "hidden",
            },
            variables: {
              colorPrimary: '#0F766E',
              colorText: '#0F172A',
              borderRadius: '0.75rem',
            },
          }}
        />
      </div>
    </FinSageAuthLayout>
  );
};
