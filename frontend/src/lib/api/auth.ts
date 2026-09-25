import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';
import {
  AuthUser,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  TokenResponse,
} from '@/types/auth';

/**
 * Authentication API Service
 * Directly interfaces with FastAPI Backend endpoints:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/refresh
 * - POST /api/v1/auth/logout
 * - GET  /api/v1/auth/me
 */
export const authApi = {
  /**
   * Register a new user account
   */
  async register(payload: RegisterRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/auth/register', payload);
    return response.data;
  },

  /**
   * Authenticate user with credentials and obtain access & refresh tokens
   */
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', payload);
    const data = response.data;
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  /**
   * Refresh the user session with a valid refresh token
   */
  async refresh(refreshToken?: string): Promise<TokenResponse> {
    const token = refreshToken || tokenStorage.getRefreshToken();
    if (!token) {
      throw new Error('No refresh token available');
    }
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: token,
    } as RefreshTokenRequest);
    const data = response.data;
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  /**
   * Revoke active session on server and clear local tokens
   */
  async logout(refreshToken?: string): Promise<MessageResponse> {
    const token = refreshToken || tokenStorage.getRefreshToken();
    let result: MessageResponse = { message: 'Logged out locally.' };

    if (token) {
      try {
        const response = await apiClient.post<MessageResponse>('/auth/logout', {
          refresh_token: token,
        } as LogoutRequest);
        result = response.data;
      } catch {
        // Proceed with local token cleanup even if remote call fails
      }
    }

    tokenStorage.clearTokens();
    return result;
  },

  /**
   * Fetch current authenticated user's profile from /auth/me
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },
};
