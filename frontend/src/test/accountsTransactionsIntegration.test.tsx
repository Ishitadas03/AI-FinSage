import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { Account } from '@/types/account';
import { ApiTransaction, TransactionPaginatedResponse } from '@/types/transaction';
import { Transactions } from '@/pages/Transactions';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  is_active: true,
  created_at: '2026-09-25T12:00:00Z',
  updated_at: null,
};

const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    user_id: 'usr-1',
    name: 'HDFC Salary Account',
    account_type: 'savings',
    balance: 85000,
    current_balance: 85000,
    credit_limit: null,
    currency: 'INR',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
  },
  {
    id: 'acc-2',
    user_id: 'usr-1',
    name: 'ICICI Sapphiro Card',
    account_type: 'credit_card',
    balance: 15000,
    current_balance: 15000,
    credit_limit: 200000,
    currency: 'INR',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
  },
];

const mockTransactions: ApiTransaction[] = [
  {
    id: 'tx-1',
    user_id: 'usr-1',
    account_id: 'acc-1',
    destination_account_id: null,
    amount: 50000,
    transaction_type: 'income',
    category: 'salary',
    merchant: 'Tech Corp Salary',
    description: 'Monthly compensation',
    reference: 'SAL-SEP2026',
    source: 'manual',
    import_fingerprint: null,
    transaction_date: '2026-09-01T09:00:00Z',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-01T09:00:00Z',
  },
  {
    id: 'tx-2',
    user_id: 'usr-1',
    account_id: 'acc-1',
    destination_account_id: null,
    amount: 2400,
    transaction_type: 'expense',
    category: null, // Imported transaction with null category
    merchant: 'Swiggy Food Order',
    description: 'Dinner delivery',
    reference: 'UPI-9821389',
    source: 'bank_statement_csv',
    import_fingerprint: 'abc123hash',
    transaction_date: '2026-09-15T20:30:00Z',
    created_at: '2026-09-15T20:30:00Z',
    updated_at: '2026-09-15T20:30:00Z',
  },
];

const mockPaginated: TransactionPaginatedResponse = {
  items: mockTransactions,
  total: 2,
  page: 1,
  page_size: 10,
  total_pages: 1,
};

// Test harness component to test FinanceContext hooks directly
const TestFinanceConsumer: React.FC = () => {
  const {
    accounts,
    transactions,
    isLoadingAccounts,
    isLoadingTransactions,
    accountsError,
    transactionsError,
    createAccount,
    updateAccount,
    deleteAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  return (
    <div>
      <div data-testid="accounts-count">{accounts.length}</div>
      <div data-testid="transactions-count">{transactions.length}</div>
      {isLoadingAccounts && <div data-testid="accounts-loading">Loading Accounts</div>}
      {isLoadingTransactions && <div data-testid="transactions-loading">Loading Transactions</div>}
      {accountsError && <div data-testid="accounts-error">{accountsError}</div>}
      {transactionsError && <div data-testid="transactions-error">{transactionsError}</div>}

      <button
        onClick={() =>
          createAccount({
            name: 'Zerodha Demat',
            account_type: 'investment',
            balance: 100000,
            currency: 'INR',
          })
        }
      >
        Add Account Test
      </button>

      <button
        onClick={() =>
          updateAccount('acc-1', {
            name: 'HDFC Premium Salary',
          })
        }
      >
        Update Account Test
      </button>

      <button onClick={() => deleteAccount('acc-1')}>Delete Account Test</button>

      <button
        onClick={() =>
          createTransaction({
            account_id: 'acc-1',
            amount: 500,
            transaction_type: 'expense',
            category: 'food',
            merchant: 'Coffee Shop',
            transaction_date: '2026-09-20T10:00:00Z',
          })
        }
      >
        Add Transaction Test
      </button>

      <button
        onClick={() =>
          updateTransaction('tx-1', {
            amount: 55000,
          })
        }
      >
        Update Transaction Test
      </button>

      <button onClick={() => deleteTransaction('tx-2')}>Delete Transaction Test</button>
    </div>
  );
};

describe('Accounts and Transactions FinanceContext Integration', () => {
  beforeEach(() => {
    tokenStorage.clearTokens();
    vi.restoreAllMocks();

    tokenStorage.setTokens('valid-access', 'valid-refresh');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(accountsApi, 'list').mockResolvedValue(mockAccounts);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue(mockPaginated);
  });

  afterEach(() => {
    tokenStorage.clearTokens();
  });

  it('populates accounts and transactions from backend upon session restore', async () => {
    render(
      <FinanceProvider>
        <TestFinanceConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('accounts-count').textContent).toBe('2');
      expect(screen.getByTestId('transactions-count').textContent).toBe('2');
    });

    expect(accountsApi.list).toHaveBeenCalledTimes(1);
    expect(transactionsApi.list).toHaveBeenCalledTimes(1);
  });

  it('creates an account and updates context state from API response', async () => {
    const createdAccount: Account = {
      id: 'acc-3',
      user_id: 'usr-1',
      name: 'Zerodha Demat',
      account_type: 'investment',
      balance: 100000,
      current_balance: 100000,
      credit_limit: null,
      currency: 'INR',
      created_at: '2026-09-25T12:00:00Z',
      updated_at: '2026-09-25T12:00:00Z',
    };

    vi.spyOn(accountsApi, 'create').mockResolvedValueOnce(createdAccount);

    render(
      <FinanceProvider>
        <TestFinanceConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('accounts-count').textContent).toBe('2');
    });

    const addBtn = screen.getByText('Add Account Test');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(accountsApi.create).toHaveBeenCalledWith({
        name: 'Zerodha Demat',
        account_type: 'investment',
        balance: 100000,
        currency: 'INR',
      });
      expect(screen.getByTestId('accounts-count').textContent).toBe('3');
    });
  });

  it('updates an account and updates context state', async () => {
    const updated: Account = {
      ...mockAccounts[0],
      name: 'HDFC Premium Salary',
    };
    vi.spyOn(accountsApi, 'update').mockResolvedValueOnce(updated);

    render(
      <FinanceProvider>
        <TestFinanceConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('accounts-count').textContent).toBe('2');
    });

    const updateBtn = screen.getByText('Update Account Test');
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(accountsApi.update).toHaveBeenCalledWith('acc-1', {
        name: 'HDFC Premium Salary',
      });
    });
  });

  it('deletes an account and updates context state', async () => {
    vi.spyOn(accountsApi, 'delete').mockResolvedValueOnce({
      message: 'Account deleted successfully',
    });

    render(
      <FinanceProvider>
        <TestFinanceConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('accounts-count').textContent).toBe('2');
    });

    const deleteBtn = screen.getByText('Delete Account Test');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(accountsApi.delete).toHaveBeenCalledWith('acc-1');
      expect(screen.getByTestId('accounts-count').textContent).toBe('1');
    });
  });

  it('creates a transaction, reloads list, and refreshes accounts', async () => {
    const createdTx: ApiTransaction = {
      id: 'tx-3',
      user_id: 'usr-1',
      account_id: 'acc-1',
      destination_account_id: null,
      amount: 500,
      transaction_type: 'expense',
      category: 'food',
      merchant: 'Coffee Shop',
      description: null,
      reference: null,
      source: 'manual',
      import_fingerprint: null,
      transaction_date: '2026-09-20T10:00:00Z',
      created_at: '2026-09-20T10:00:00Z',
      updated_at: '2026-09-20T10:00:00Z',
    };

    vi.spyOn(transactionsApi, 'create').mockResolvedValueOnce(createdTx);

    render(
      <FinanceProvider>
        <TestFinanceConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('transactions-count').textContent).toBe('2');
    });

    vi.spyOn(transactionsApi, 'list').mockResolvedValueOnce({
      items: [createdTx, ...mockTransactions],
      total: 3,
      page: 1,
      page_size: 10,
      total_pages: 1,
    });

    const addTxBtn = screen.getByText('Add Transaction Test');
    fireEvent.click(addTxBtn);

    await waitFor(() => {
      expect(transactionsApi.create).toHaveBeenCalledWith({
        account_id: 'acc-1',
        amount: 500,
        transaction_type: 'expense',
        category: 'food',
        merchant: 'Coffee Shop',
        transaction_date: '2026-09-20T10:00:00Z',
      });
      expect(screen.getByTestId('transactions-count').textContent).toBe('3');
    });
  });

  it('displays null category transactions as "Uncategorized" in UI without changing data', async () => {
    render(
      <FinanceProvider>
        <Transactions />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Swiggy Food Order')).toBeInTheDocument();
    });

    // The transaction with null category should render "Uncategorized"
    const uncategorizedBadges = screen.getAllByText('Uncategorized');
    expect(uncategorizedBadges.length).toBeGreaterThan(0);
  });

  it('handles empty accounts and transactions states properly', async () => {
    vi.spyOn(accountsApi, 'list').mockResolvedValue([]);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1,
    });

    render(
      <FinanceProvider>
        <Transactions />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No transactions found.')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(accountsApi, 'list').mockRejectedValueOnce(new Error('Internal Server Error'));
    vi.spyOn(transactionsApi, 'list').mockRejectedValueOnce(new Error('Database Timeout'));

    render(
      <FinanceProvider>
        <TestFinanceConsumer />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('accounts-error').textContent).toContain('Internal Server Error');
      expect(screen.getByTestId('transactions-error').textContent).toContain('Database Timeout');
    });
  });

  it('renders AddTransactionModal with real accounts and creates transaction', async () => {
    const ModalTestHarness = () => {
      const { setIsAddTransactionOpen } = useFinance();
      React.useEffect(() => {
        setIsAddTransactionOpen(true);
      }, [setIsAddTransactionOpen]);

      return <AddTransactionModal />;
    };

    const newCreatedTx: ApiTransaction = {
      id: 'tx-99',
      user_id: 'usr-1',
      account_id: 'acc-1',
      destination_account_id: null,
      amount: 1200,
      transaction_type: 'expense',
      category: 'food',
      merchant: 'FreshMart',
      description: 'Weekly veggies',
      reference: null,
      source: 'manual',
      import_fingerprint: null,
      transaction_date: '2026-09-25T00:00:00.000Z',
      created_at: '2026-09-25T00:00:00.000Z',
      updated_at: '2026-09-25T00:00:00.000Z',
    };

    vi.spyOn(transactionsApi, 'create').mockResolvedValueOnce(newCreatedTx);

    render(
      <FinanceProvider>
        <ModalTestHarness />
      </FinanceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
      expect(screen.getByText(/HDFC Salary Account/i)).toBeInTheDocument();
    });

    const merchantInput = screen.getByPlaceholderText(/Swiggy, Amazon/i);
    const amountInput = screen.getByPlaceholderText(/₹ 0.00/i);

    fireEvent.change(merchantInput, { target: { value: 'FreshMart' } });
    fireEvent.change(amountInput, { target: { value: '1200' } });

    const submitBtn = screen.getByRole('button', { name: /Record Transaction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(transactionsApi.create).toHaveBeenCalled();
    });
  });
});

