import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { FinSageLoader } from '@/components/FinSageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authStatus } = useFinance();
  const location = useLocation();

  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <FinSageLoader isFullScreen={true} duration={1000} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
