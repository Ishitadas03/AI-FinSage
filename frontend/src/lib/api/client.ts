import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';
import { ApiErrorResponse, TokenResponse } from '@/types/auth';

/**
 * Resolve API Base URL:
 * Prefers VITE_API_BASE_URL from environment, otherwise defaults to '/api/v1'.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (!trimmed.endsWith('/api/v1')) {
      return `${trimmed}/api/v1`;
    }
    return trimmed;
  }
  return '/api/v1';
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Dynamic token getter registered by Clerk Auth Provider
export type TokenGetter = () => Promise<string | null>;
let dynamicTokenGetter: TokenGetter | null = null;

export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  dynamicTokenGetter = getter;
};

// Event listener callback for session expiration
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: (() => void) | null) => {
  onUnauthorizedCallback = cb;
};

// Queue for pending requests while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Dynamically attach Clerk Token or Fallback Access Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token: string | null = null;

    // 1. Prioritize dynamic token getter from Clerk Auth Bridge (useAuth.getToken)
    if (dynamicTokenGetter) {
      try {
        token = await dynamicTokenGetter();
      } catch (err) {
        console.warn('Failed to retrieve token from dynamic auth getter:', err);
      }
    }

    // 2. Direct Clerk window instance if available
    if (!token && typeof window !== 'undefined') {
      const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
      if (clerk?.session?.getToken) {
        try {
          token = await clerk.session.getToken();
        } catch {
          // Ignore
        }
      }
    }

    // 3. Fallback to legacy tokenStorage (for tests and offline mocks)
    if (!token) {
      token = tokenStorage.getAccessToken();
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Token Expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If no response or not a 401, reject immediately
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // If the failed request was the auth endpoint or already retried, prevent loops
    const url = originalRequest.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register') || originalRequest._retry) {
      tokenStorage.clearTokens();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return Promise.reject(error);
    }

    // If Clerk dynamic token getter is active, attempt a single refresh with skipCache
    const globalClerk = typeof window !== 'undefined'
      ? (window as unknown as { Clerk?: { session?: { getToken: (opts?: { skipCache?: boolean }) => Promise<string | null> } } }).Clerk
      : undefined;

    if (dynamicTokenGetter || globalClerk?.session) {
      originalRequest._retry = true;
      try {
        let freshToken: string | null = null;
        if (dynamicTokenGetter) {
          freshToken = await dynamicTokenGetter();
        } else if (globalClerk?.session) {
          freshToken = await globalClerk.session.getToken({ skipCache: true });
        }

        if (freshToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Token retrieval failed
      }

      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return Promise.reject(error);
    }

    // Fallback refresh flow for test mock legacy sessions
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clearTokens();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Direct axios call to avoid interceptor loop
      const response = await axios.post<TokenResponse>(
        `${getApiBaseUrl()}/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const data = response.data;
      tokenStorage.setTokens(data.access_token, data.refresh_token);

      processQueue(null, data.access_token);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      }

      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      tokenStorage.clearTokens();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Standardized API error parser
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred.'): string => {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const detail = axiosErr.response?.data?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === 'object' && first?.msg) {
        return first.msg;
      }
    }

    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }

    if (axiosErr.message === 'Network Error') {
      return 'Unable to connect to the FinSage server. Please ensure the backend is running.';
    }

    if (axiosErr.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }
  } else if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
