import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { getApiBaseUrl, getApiErrorMessage, apiClient } from '@/lib/api/client';

describe('Central API Client & Token Storage', () => {
  beforeEach(() => {
    tokenStorage.clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('correctly configures default API base URL', () => {
    const baseUrl = getApiBaseUrl();
    expect(baseUrl).toBe('/api/v1');
  });

  it('manages access tokens in memory and refresh tokens in sessionStorage', () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.hasSession()).toBe(false);

    tokenStorage.setTokens('access-123', 'refresh-456');

    expect(tokenStorage.getAccessToken()).toBe('access-123');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-456');
    expect(tokenStorage.hasSession()).toBe(true);

    tokenStorage.clearTokens();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.hasSession()).toBe(false);
  });

  it('extracts string detail from FastAPI validation errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          detail: 'Invalid email address or password.',
        },
      },
    };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const msg = getApiErrorMessage(error);
    expect(msg).toBe('Invalid email address or password.');
  });

  it('extracts array of validation errors from FastAPI schema responses', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          detail: [{ loc: ['body', 'password'], msg: 'String should have at least 8 characters' }],
        },
      },
    };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const msg = getApiErrorMessage(error);
    expect(msg).toBe('String should have at least 8 characters');
  });

  it('returns fallback message for generic network or server errors', () => {
    const error = new Error('Generic failure');
    const msg = getApiErrorMessage(error);
    expect(msg).toBe('Generic failure');

    const unknownErr = { random: 123 };
    const fallbackMsg = getApiErrorMessage(unknownErr, 'Default error message');
    expect(fallbackMsg).toBe('Default error message');
  });
});
