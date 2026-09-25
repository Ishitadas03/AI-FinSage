import React, { useState } from 'react';
import { FinSageAuthLayout } from '@/components/auth/FinSageAuthLayout';
import { SignInCard } from '@/components/auth/SignInCard';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(initialMode);

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
