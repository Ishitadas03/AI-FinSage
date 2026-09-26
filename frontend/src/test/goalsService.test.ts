import { describe, it, expect, beforeEach, vi } from 'vitest';
import { goalsApi } from '@/lib/api/goals';
import { apiClient } from '@/lib/api/client';
import { ApiGoal, GoalContribution, GoalCreate, GoalUpdate } from '@/types/goal';

describe('Goals API Service', () => {
  const mockGoal: ApiGoal = {
    id: 'goal-uuid-1',
    user_id: 'usr-uuid-1',
    name: 'Emergency Fund',
    description: '6 months expenses reserve',
    goal_type: 'emergency_fund',
    target_amount: 300000,
    current_amount: 180000,
    target_date: '2028-12-31',
    priority: 'high',
    status: 'active',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
    derived_state: {
      progress_percentage: 60,
      remaining_amount: 120000,
      remaining_months: 27,
      required_monthly_contribution: 4444.44,
      is_overdue: false,
      is_on_track: true,
      contribution_total: 180000,
      has_contribution_history: true,
    },
  };

  const mockContribution: GoalContribution = {
    id: 'contrib-uuid-1',
    goal_id: 'goal-uuid-1',
    user_id: 'usr-uuid-1',
    amount: 10000,
    contribution_date: '2026-09-26',
    note: 'September Deposit',
    created_at: '2026-09-26T10:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a goal via POST /goals', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockGoal,
    });

    const payload: GoalCreate = {
      name: 'Emergency Fund',
      goal_type: 'emergency_fund',
      target_amount: 300000,
      current_amount: 180000,
      target_date: '2028-12-31',
    };

    const result = await goalsApi.create(payload);
    expect(postSpy).toHaveBeenCalledWith('/goals', payload);
    expect(result).toEqual(mockGoal);
  });

  it('lists goals via GET /goals', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [mockGoal],
    });

    const result = await goalsApi.list();
    expect(getSpy).toHaveBeenCalledWith('/goals', { params: undefined });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Emergency Fund');
  });

  it('fetches a single goal by ID via GET /goals/{id}', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockGoal,
    });

    const result = await goalsApi.get('goal-uuid-1');
    expect(getSpy).toHaveBeenCalledWith('/goals/goal-uuid-1');
    expect(result.id).toBe('goal-uuid-1');
  });

  it('updates a goal via PATCH /goals/{id}', async () => {
    const updatedGoal = { ...mockGoal, target_amount: 350000 };
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: updatedGoal,
    });

    const payload: GoalUpdate = { target_amount: 350000 };
    const result = await goalsApi.update('goal-uuid-1', payload);

    expect(patchSpy).toHaveBeenCalledWith('/goals/goal-uuid-1', payload);
    expect(result.target_amount).toBe(350000);
  });

  it('deletes a goal via DELETE /goals/{id}', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { message: 'Financial goal successfully deleted.' },
    });

    const result = await goalsApi.delete('goal-uuid-1');
    expect(deleteSpy).toHaveBeenCalledWith('/goals/goal-uuid-1');
    expect(result.message).toBe('Financial goal successfully deleted.');
  });

  it('records a contribution via POST /goals/{id}/contributions', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockContribution,
    });

    const result = await goalsApi.createContribution('goal-uuid-1', {
      amount: 10000,
      contribution_date: '2026-09-26',
      note: 'September Deposit',
    });

    expect(postSpy).toHaveBeenCalledWith('/goals/goal-uuid-1/contributions', {
      amount: 10000,
      contribution_date: '2026-09-26',
      note: 'September Deposit',
    });
    expect(result).toEqual(mockContribution);
  });
});
