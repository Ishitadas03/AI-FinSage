/**
 * User Profile API Client (Phase 5).
 */
import { apiClient } from './client';
import { ApiUserProfile, UserProfileUpdate } from '../../types';

export const usersApi = {
  /**
   * Fetch authenticated user profile.
   */
  async getProfile(): Promise<ApiUserProfile> {
    const res = await apiClient.get<ApiUserProfile>('/users/me');
    return res.data;
  },

  /**
   * Update mutable application profile fields.
   */
  async updateProfile(payload: UserProfileUpdate): Promise<ApiUserProfile> {
    const res = await apiClient.patch<ApiUserProfile>('/users/me', payload);
    return res.data;
  },
};
