import React, { useState } from 'react';
import { FinSageAuthLayout } from '@/components/auth/FinSageAuthLayout';
import { SignInCard } from '@/components/auth/SignInCard';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, authStatus } = useFinance();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(initialMode);

  if (isAuthenticated && authStatus !== 'loading') {
    const state = location.state as { from?: { pathname?: string } } | null;
    const from = state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <FinSageAuthLayout
      headerActionText={currentMode === 'signin' ? "Don't have an account?" : "Already have an account?"}
      headerButtonText={currentMode === 'signin' ? "Create Account" : "Sign In"}
      onHeaderActionClick={() => {
        setCurrentMode(currentMode === 'signin' ? 'signup' : 'signin');
      }}
    >
      <SignInCard
        key={currentMode}
        initialMode={currentMode}
        onSuccess={() => navigate('/dashboard', { replace: true })}
      />
    </FinSageAuthLayout>
  );
};
