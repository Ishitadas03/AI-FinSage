import React, { useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { setAuthTokenGetter } from '@/lib/api/client';

export const ClerkAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (getToken) {
      setAuthTokenGetter(async () => {
        try {
          // Retrieve template token or default session token
          const token = await getToken();
          return token;
        } catch (err) {
          console.warn('Clerk getToken error:', err);
          return null;
        }
      });
    }

    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken, isSignedIn]);

  return <>{children}</>;
};
