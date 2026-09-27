import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FinanceProvider } from '@/context/FinanceContext';
import { PWAInstallProvider } from '@/context/PWAInstallContext';
import { Topbar } from '@/components/layout/Topbar';
import { notificationsApi } from '@/lib/api/notifications';
import { recurringBillsApi } from '@/lib/api/recurringBills';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { NotificationItem } from '@/types/notification';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  created_at: '2026-01-01T00:00:00Z',
};

const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: 'usr-1',
    type: 'bill_upcoming',
    title: 'Upcoming Bill: Electricity',
    message: '₹2,400 is due in 3 days.',
    reference_id: 'bill-1',
    is_read: false,
    created_at: '2026-09-27T08:00:00Z',
    read_at: null,
  },
  {
    id: 'notif-2',
    user_id: 'usr-1',
    type: 'budget_alert',
    title: 'Budget Alert: Dining',
    message: 'You have used 85% of your dining budget.',
    reference_id: null,
    is_read: true,
    created_at: '2026-09-26T10:00:00Z',
    read_at: '2026-09-26T12:00:00Z',
  },
];

describe('Notifications Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('test-token');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser as any);
    vi.spyOn(accountsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      transactions: [],
      total: 0,
      page: 1,
      page_size: 50,
      total_pages: 1,
    } as any);
    vi.spyOn(budgetsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(goalsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(loansApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(recurringBillsApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
      active_count: 0,
      monthly_committed_total: 0,
    });

    vi.spyOn(notificationsApi, 'list').mockResolvedValue({
      items: mockNotifications,
      total: 2,
      unread_count: 1,
    });
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  const renderTopbar = () =>
    render(
      <BrowserRouter>
        <PWAInstallProvider>
          <FinanceProvider>
            <Topbar onOpenMobileMenu={() => {}} />
          </FinanceProvider>
        </PWAInstallProvider>
      </BrowserRouter>
    );

  it('renders unread notifications badge in Topbar', async () => {
    renderTopbar();

    // Unread badge count is 1
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens notifications dropdown and lists items with read/unread states', async () => {
    renderTopbar();

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Find bell icon button and click it
    const bellButton = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Bill: Electricity')).toBeInTheDocument();
      expect(screen.getByText('Budget Alert: Dining')).toBeInTheDocument();
      expect(screen.getByText('₹2,400 is due in 3 days.')).toBeInTheDocument();
    });
  });

  it('marks all notifications as read', async () => {
    const markAllSpy = vi.spyOn(notificationsApi, 'markAllRead').mockResolvedValue({
      message: 'All notifications marked as read',
      count: 1,
    });

    renderTopbar();

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    const bellButton = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    const markAllBtn = screen.getByText('Mark all as read');
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalled();
    });
  });

  it('deletes a notification', async () => {
    const deleteSpy = vi.spyOn(notificationsApi, 'delete').mockResolvedValue({
      message: 'Notification deleted successfully',
    });

    renderTopbar();

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    const bellButton = screen.getByRole('button', { name: /Notifications/i });
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Bill: Electricity')).toBeInTheDocument();
    });

    // Find delete buttons in popover
    const deleteButtons = screen.getAllByTitle('Delete notification');
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('notif-1');
    });
  });
});
