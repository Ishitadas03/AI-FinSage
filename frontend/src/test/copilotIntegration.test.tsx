import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { PWAInstallProvider } from '@/context/PWAInstallContext';
import { AICopilotDrawer } from '@/components/modals/AICopilotDrawer';
import { copilotApi } from '@/lib/api/copilot';
import { authApi } from '@/lib/api/auth';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { recurringBillsApi } from '@/lib/api/recurringBills';
import { notificationsApi } from '@/lib/api/notifications';
import { tokenStorage } from '@/lib/api/tokenStorage';

const mockUser = {
  id: 'usr-copilot-1',
  email: 'test@finsage.io',
  full_name: 'Alex Mercer',
  created_at: '2026-01-01T00:00:00Z',
};

const mockHistoryResponse = {
  messages: [
    {
      id: 'msg-1',
      role: 'user' as const,
      content: 'What is my savings rate?',
      created_at: '2026-09-27T10:00:00Z',
    },
    {
      id: 'msg-2',
      role: 'assistant' as const,
      content: 'Your current monthly savings rate is 28.0% based on ₹85,000 income and ₹54,200 expenses.',
      intent: 'spending',
      metrics_snapshot: { savings_rate: 28.0 },
      suggested_queries: ['Show my budget utilization breakdown'],
      created_at: '2026-09-27T10:00:01Z',
    },
  ],
  total: 2,
};

const TestTrigger: React.FC = () => {
  const { setIsChatOpen } = useFinance();
  return (
    <div>
      <button onClick={() => setIsChatOpen(true)}>Open Copilot</button>
      <AICopilotDrawer />
    </div>
  );
};

describe('AI Copilot Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('test-token');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser as any);
    vi.spyOn(accountsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      transactions: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    } as any);
    vi.spyOn(budgetsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(goalsApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(loansApi, 'list').mockResolvedValue([] as any);
    vi.spyOn(recurringBillsApi, 'list').mockResolvedValue({ bills: [], total: 0, active_count: 0, total_monthly_committed: 0 } as any);
    vi.spyOn(notificationsApi, 'list').mockResolvedValue({ notifications: [], total: 0, unread_count: 0 } as any);

    vi.spyOn(copilotApi, 'getHistory').mockResolvedValue(mockHistoryResponse);
    vi.spyOn(copilotApi, 'chat').mockResolvedValue({
      id: 'msg-3',
      role: 'assistant',
      content: 'You have ₹10,800 remaining across your active category budgets.',
      intent: 'budget',
      metrics_snapshot: { net_worth: 150000.0 },
      suggested_queries: ['Which budget is at risk?'],
      created_at: '2026-09-27T10:05:00Z',
    });
    vi.spyOn(copilotApi, 'clearHistory').mockResolvedValue({ message: 'History cleared' });
  });

  it('loads history and renders assistant messages when opened', async () => {
    render(
      <PWAInstallProvider>
        <FinanceProvider>
          <TestTrigger />
        </FinanceProvider>
      </PWAInstallProvider>
    );

    fireEvent.click(screen.getByText('Open Copilot'));

    await waitFor(() => {
      expect(copilotApi.getHistory).toHaveBeenCalled();
      expect(screen.getByText(/Your current monthly savings rate is 28.0%/i)).toBeInTheDocument();
    });
  });

  it('submits a user question and renders grounded response', async () => {
    render(
      <PWAInstallProvider>
        <FinanceProvider>
          <TestTrigger />
        </FinanceProvider>
      </PWAInstallProvider>
    );

    fireEvent.click(screen.getByText('Open Copilot'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask anything about your savings/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask anything about your savings/i);
    fireEvent.change(input, { target: { value: 'How are my budgets doing?' } });

    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(copilotApi.chat).toHaveBeenCalledWith({ message: 'How are my budgets doing?' });
      expect(screen.getByText(/You have ₹10,800 remaining across your active category budgets/i)).toBeInTheDocument();
    });
  });

  it('clears conversation history when trash button is clicked', async () => {
    render(
      <PWAInstallProvider>
        <FinanceProvider>
          <TestTrigger />
        </FinanceProvider>
      </PWAInstallProvider>
    );

    fireEvent.click(screen.getByText('Open Copilot'));

    await waitFor(() => {
      expect(screen.getByTitle('Clear chat history')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Clear chat history'));

    await waitFor(() => {
      expect(copilotApi.clearHistory).toHaveBeenCalled();
    });
  });
});
