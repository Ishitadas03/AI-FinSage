import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';

const mockUser = {
  id: 'usr-999-uuid',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  is_active: true,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: null,
};

const mockTokenResponse = {
  access_token: 'valid.jwt.access',
  refresh_token: 'valid.jwt.refresh',
  token_type: 'bearer',
  expires_in: 1800,
  user: mockUser,
};

// Test consumer component
const AuthTestComponent = () => {
  const {
    authUser,
    user,
    isAuthenticated,
    authStatus,
    authError,
    login,
    register,
    logout,
  } = useFinance();

  return (
    <div>
      <div data-testid="auth-status">{authStatus}</div>
      <div data-testid="is-authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user-email">{authUser?.email || user.email || 'none'}</div>
      <div data-testid="user-name">{user.name}</div>
      {authError && <div data-testid="auth-error">{authError}</div>}

      <button
        onClick={() => login('investor@finsage.io', 'ValidPassword123!')}
      >
        Trigger Login
      </button>

      <button
        onClick={() => login('invalid@finsage.io', 'WrongPassword')}
      >
        Trigger Failed Login
      </button>

      <button
        onClick={() => register('newuser@finsage.io', 'SecurePass123!', 'New FinSage User')}
      >
        Trigger Register
      </button>

      <button onClick={() => logout()}>
        Trigger Logout
      </button>
    </div>
  );
};

const ProtectedTarget = () => <div data-testid="protected-content">Dashboard Protected Area</div>;
const SignInMockPage = () => {
  const location = useLocation();
  return (
    <div>
      <div data-testid="signin-page">Sign In Page</div>
      <div data-testid="redirected-from">
        {(location.state as { from?: { pathname?: string } } | null)?.from?.pathname || 'none'}
      </div>
    </div>
  );
};

describe('Finance Context & Route Protection Authentication Integration', () => {
  beforeEach(() => {
    tokenStorage.clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    tokenStorage.clearTokens();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts unauthenticated when no tokens exist in storage', async () => {
    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
  });

  it('automatically restores authenticated user session on mount if token exists', async () => {
    tokenStorage.setTokens('existing-access-token', 'existing-refresh-token');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValueOnce(mockUser);

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('user-email').textContent).toBe('investor@finsage.io');
    expect(screen.getByTestId('user-name').textContent).toBe('Rahul Sharma');
  });

  it('handles expired access token on mount by attempting refresh', async () => {
    tokenStorage.setTokens('expired-access', 'valid-refresh');

    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(new Error('Token expired'));
    vi.spyOn(authApi, 'refresh').mockResolvedValueOnce(mockTokenResponse);

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('user-email').textContent).toBe('investor@finsage.io');
  });

  it('clears session and sets unauthenticated if both getCurrentUser and refresh fail', async () => {
    tokenStorage.setTokens('bad-access', 'bad-refresh');

    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(new Error('Unauthorized'));
    vi.spyOn(authApi, 'refresh').mockRejectedValueOnce(new Error('Invalid refresh token'));

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
    expect(tokenStorage.hasSession()).toBe(false);
  });

  it('handles successful login flow and updates context', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValueOnce(mockTokenResponse);

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    const loginBtn = screen.getByText('Trigger Login');
    await act(async () => {
      fireEvent.click(loginBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('investor@finsage.io');
  });

  it('handles failed login and displays error message', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { detail: 'Invalid email address or password.' },
        status: 401,
      },
    });

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    const failBtn = screen.getByText('Trigger Failed Login');
    await act(async () => {
      fireEvent.click(failBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-error').textContent).toBe('Invalid email address or password.');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
    expect(screen.getByTestId('auth-status').textContent).toBe('error');
  });

  it('handles successful registration followed by auto-login', async () => {
    const newUser = {
      ...mockUser,
      email: 'newuser@finsage.io',
      full_name: 'New FinSage User',
    };

    vi.spyOn(authApi, 'register').mockResolvedValueOnce(newUser);
    vi.spyOn(authApi, 'login').mockResolvedValueOnce({
      ...mockTokenResponse,
      user: newUser,
    });

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    const registerBtn = screen.getByText('Trigger Register');
    await act(async () => {
      fireEvent.click(registerBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('newuser@finsage.io');
    expect(screen.getByTestId('user-name').textContent).toBe('New FinSage User');
  });

  it('handles logout and clears auth state', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValueOnce(mockUser);
    vi.spyOn(authApi, 'logout').mockResolvedValueOnce({ message: 'Logged out.' });

    render(
      <FinanceProvider>
        <AuthTestComponent />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    const logoutBtn = screen.getByText('Trigger Logout');
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
    });

    expect(tokenStorage.hasSession()).toBe(false);
  });

  it('ProtectedRoute redirects unauthenticated visitors to /signin with redirect state', async () => {
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
            <Route path="/signin" element={<SignInMockPage />} />
          </Routes>
        </MemoryRouter>
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('redirected-from').textContent).toBe('/dashboard');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('ProtectedRoute renders protected content for authenticated users', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValueOnce(mockUser);

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
            <Route path="/signin" element={<SignInMockPage />} />
          </Routes>
        </MemoryRouter>
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('signin-page')).not.toBeInTheDocument();
  });

  it('SignInPage redirects authenticated users to /dashboard', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValueOnce(mockUser);

    const { SignInPage } = await import('@/pages/public/auth/SignInPage');

    render(
      <FinanceProvider>
        <MemoryRouter initialEntries={['/signin']}>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/dashboard" element={<ProtectedTarget />} />
          </Routes>
        </MemoryRouter>
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
