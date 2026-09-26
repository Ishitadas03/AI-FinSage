import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { useFinance } from '@/context/FinanceContext';
import { FinSageLoader } from '@/components/FinSageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, authStatus } = useFinance();
  const location = useLocation();

  if (!isLoaded || authStatus === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <FinSageLoader isFullScreen={true} duration={1000} />
      </div>
    );
  }

  const isUserAuthenticated = isSignedIn || isAuthenticated;

  if (!isUserAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
