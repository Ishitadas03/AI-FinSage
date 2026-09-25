import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authApi } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { tokenStorage } from '@/lib/api/tokenStorage';

describe('Auth API Service', () => {
  const mockUser = {
    id: 'usr-1234-uuid',
    email: 'test@finsage.io',
    full_name: 'Test User',
    is_active: true,
    created_at: '2026-09-25T12:00:00Z',
    updated_at: null,
  };

  const mockTokenResponse = {
    access_token: 'jwt.access.token',
    refresh_token: 'jwt.refresh.token',
    token_type: 'bearer',
    expires_in: 1800,
    user: mockUser,
  };

  beforeEach(() => {
    tokenStorage.clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('performs user registration against POST /auth/register', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockUser,
    });

    const result = await authApi.register({
      email: 'test@finsage.io',
      password: 'StrongPassword123!',
      full_name: 'Test User',
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/register', {
      email: 'test@finsage.io',
      password: 'StrongPassword123!',
      full_name: 'Test User',
    });
    expect(result).toEqual(mockUser);
  });

  it('performs login, receives tokens, and stores them in tokenStorage', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockTokenResponse,
    });

    const result = await authApi.login({
      email: 'test@finsage.io',
      password: 'StrongPassword123!',
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'test@finsage.io',
      password: 'StrongPassword123!',
    });
    expect(result).toEqual(mockTokenResponse);
    expect(tokenStorage.getAccessToken()).toBe('jwt.access.token');
    expect(tokenStorage.getRefreshToken()).toBe('jwt.refresh.token');
  });

  it('fetches current user profile from GET /auth/me', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockUser,
    });

    const result = await authApi.getCurrentUser();
    expect(getSpy).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockUser);
  });

  it('refreshes active tokens with POST /auth/refresh', async () => {
    tokenStorage.setTokens('old-access', 'existing-refresh');

    const rotatedTokenResponse = {
      ...mockTokenResponse,
      access_token: 'new.jwt.access.token',
      refresh_token: 'new.jwt.refresh.token',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: rotatedTokenResponse,
    });

    const result = await authApi.refresh();
    expect(postSpy).toHaveBeenCalledWith('/auth/refresh', {
      refresh_token: 'existing-refresh',
    });
    expect(result).toEqual(rotatedTokenResponse);
    expect(tokenStorage.getAccessToken()).toBe('new.jwt.access.token');
    expect(tokenStorage.getRefreshToken()).toBe('new.jwt.refresh.token');
  });

  it('revokes server session and clears local tokens on logout', async () => {
    tokenStorage.setTokens('access', 'refresh-token-to-revoke');

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { message: 'Session successfully revoked and logged out.' },
    });

    const result = await authApi.logout();
    expect(postSpy).toHaveBeenCalledWith('/auth/logout', {
      refresh_token: 'refresh-token-to-revoke',
    });
    expect(result.message).toContain('revoked');
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
