import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { apiClient, setAuthTokenGetter, setOnUnauthorizedCallback } from '@/lib/api/client';
import { ClerkMissingKeyScreen } from '@/components/auth/ClerkMissingKeyScreen';
import { ClerkAuthBridge } from '@/components/auth/ClerkAuthBridge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SignInPage } from '@/pages/public/auth/SignInPage';
import { SignUpPage } from '@/pages/public/auth/SignUpPage';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import * as clerkReact from '@clerk/react';
import axios from 'axios';

const ProtectedTarget = () => <div data-testid="protected-content">Dashboard Protected Area</div>;

describe('Clerk Frontend Integration & Token Attachment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAuthTokenGetter(null);
    setOnUnauthorizedCallback(null);
  });

  afterEach(() => {
    setAuthTokenGetter(null);
    setOnUnauthorizedCallback(null);
  });

  it('renders ClerkMissingKeyScreen with clear guidance when publishable key is missing', () => {
    render(<ClerkMissingKeyScreen />);

    expect(screen.getByText(/Clerk Configuration Required/i)).toBeInTheDocument();
    expect(screen.getByText(/VITE_CLERK_PUBLISHABLE_KEY=pk_test_/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.clerk\.com/i)).toBeInTheDocument();
  });

  it('renders Clerk SignIn component on SignInPage with branding', () => {
    render(
      <MemoryRouter initialEntries={['/signin']}>
        <SignInPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('clerk-signin-component')).toBeInTheDocument();
    expect(screen.getAllByText(/Create Account/i).length).toBeGreaterThan(0);
  });

  it('renders Clerk SignUp component on SignUpPage with branding', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <SignUpPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('clerk-signup-component')).toBeInTheDocument();
    expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0);
  });

  it('ProtectedRoute blocks unauthenticated users and redirects to /signin', () => {
    vi.spyOn(clerkReact, 'useAuth').mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof clerkReact.useAuth>);

    render(
      <FinanceProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedTarget />
                </ProtectedRoute>
              }
            />
            <Route path="/signin" element={<div data-testid="signin-page">Sign In Form</div>} />
          </Routes>
        </MemoryRouter>
      </FinanceProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('signin-page')).toBeInTheDocument();
  });

  it('ProtectedRoute grants access to authenticated Clerk users', () => {
    vi.spyOn(clerkReact, 'useAuth').mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_clerk_123',
      sessionId: 'sess_123',
      getToken: vi.fn().mockResolvedValue('clerk.jwt.token'),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof clerkReact.useAuth>);

    render(
      <FinanceProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedTarget />
                </ProtectedRoute>
              }
            />
            <Route path="/signin" element={<div data-testid="signin-page">Sign In Form</div>} />
          </Routes>
        </MemoryRouter>
      </FinanceProvider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('attaches Clerk session token to apiClient requests dynamically via setAuthTokenGetter', async () => {
    const mockClerkToken = 'clerk.rs256.jwt.token.xyz';
    const tokenGetter = vi.fn().mockResolvedValue(mockClerkToken);
    setAuthTokenGetter(tokenGetter);

    // Spy on axios adapter or interceptor execution
    let capturedAuthHeader: string | undefined;
    const originalAdapter = apiClient.defaults.adapter;

    apiClient.defaults.adapter = async (config) => {
      capturedAuthHeader = config.headers?.Authorization as string;
      return {
        data: { status: 'ok' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await apiClient.get('/accounts');
      expect(tokenGetter).toHaveBeenCalled();
      expect(capturedAuthHeader).toBe(`Bearer ${mockClerkToken}`);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('handles 401 responses gracefully when Clerk token getter is configured without refresh loop', async () => {
    const onUnauthorized = vi.fn();
    setOnUnauthorizedCallback(onUnauthorized);

    const tokenGetter = vi.fn().mockResolvedValue('expired.clerk.token');
    setAuthTokenGetter(tokenGetter);

    const originalAdapter = apiClient.defaults.adapter;
    let callCount = 0;

    apiClient.defaults.adapter = async (config) => {
      callCount += 1;
      const error = new axios.AxiosError(
        'Request failed with status code 401',
        '401',
        config,
        undefined,
        {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Clerk token expired or invalid.' },
          headers: {},
          config,
        }
      );
      throw error;
    };

    try {
      await expect(apiClient.get('/dashboard/analytics')).rejects.toThrow();
      expect(onUnauthorized).toHaveBeenCalled();
      // Should not trigger infinite refresh loop
      expect(callCount).toBeLessThanOrEqual(2);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('ClerkAuthBridge binds useAuth getToken to apiClient', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('clerk-bridge-token-999');
    vi.spyOn(clerkReact, 'useAuth').mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_clerk_456',
      sessionId: 'sess_456',
      getToken: mockGetToken,
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof clerkReact.useAuth>);

    render(
      <ClerkAuthBridge>
        <div data-testid="bridge-child">Bridge Active</div>
      </ClerkAuthBridge>
    );

    expect(screen.getByTestId('bridge-child')).toBeInTheDocument();

    let capturedAuthHeader: string | undefined;
    const originalAdapter = apiClient.defaults.adapter;

    apiClient.defaults.adapter = async (config) => {
      capturedAuthHeader = config.headers?.Authorization as string;
      return {
        data: { status: 'ok' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await apiClient.get('/budgets');
      expect(mockGetToken).toHaveBeenCalled();
      expect(capturedAuthHeader).toBe('Bearer clerk-bridge-token-999');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});
