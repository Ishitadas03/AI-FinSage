import React from 'react';
import { FinSageAuthLayout } from '@/components/auth/FinSageAuthLayout';
import { SignInCard } from '@/components/auth/SignInCard';
import { useNavigate } from 'react-router-dom';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FinSageAuthLayout
      headerActionText="Don't have an account?"
      headerButtonText="Get Started"
      headerButtonLink="/dashboard"
      onHeaderActionClick={() => navigate('/dashboard')}
    >
      <SignInCard onSuccess={() => navigate('/dashboard')} />
    </FinSageAuthLayout>
  );
};
