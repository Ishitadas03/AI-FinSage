import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FinanceProvider } from '@/context/FinanceContext';
import { ImportStatementModal } from '@/components/modals/ImportStatementModal';
import { bankImportApi } from '@/lib/api/bankImport';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { Account } from '@/types/account';
import { BankStatementPreviewResponse, BankStatementImportCommitResponse } from '@/types/bankStatement';

const mockUser = {
  id: 'usr-import-1',
  email: 'tester@finsage.io',
  full_name: 'Test User',
  is_active: true,
  created_at: '2026-09-25T12:00:00Z',
  updated_at: null,
};

const mockAccounts: Account[] = [
  {
    id: 'acc-savings-1',
    user_id: 'usr-import-1',
    name: 'HDFC Bank Account',
    account_type: 'savings',
    balance: 50000,
    current_balance: 50000,
    credit_limit: null,
    currency: 'INR',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
  },
  {
    id: 'acc-credit-2',
    user_id: 'usr-import-1',
    name: 'ICICI Credit Card',
    account_type: 'credit_card',
    balance: 10000,
    current_balance: 10000,
    credit_limit: 100000,
    currency: 'INR',
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
  },
];

const mockPreviewResponse: BankStatementPreviewResponse = {
  filename: 'bank_statement.csv',
  file_hash: 'hash-abc-1234567890',
  detected_format: 'debit_credit',
  total_rows: 3,
  valid_rows: 2,
  invalid_rows: 1,
  preview_count: 2,
  has_more_preview_rows: false,
  normalized_rows: [
    {
      transaction_date: '2026-09-15T00:00:00Z',
      description: 'Swiggy Bangalore Order',
      merchant: 'Swiggy',
      amount: '450.00',
      type: 'expense',
      category: 'food',
      reference: 'UPI123456',
      raw_row: { Date: '15/09/2026', Description: 'Swiggy Bangalore Order', Debit: '450.00' },
    },
    {
      transaction_date: '2026-09-16T00:00:00Z',
      description: 'Monthly Salary Acme Corp',
      merchant: 'Salary Inflow',
      amount: '75000.00',
      type: 'income',
      category: 'salary',
      reference: 'SAL202609',
      raw_row: { Date: '16/09/2026', Description: 'Monthly Salary Acme Corp', Credit: '75000.00' },
    },
  ],
  validation_errors: [
    {
      row_number: 3,
      field_name: 'Date',
      error_message: 'Invalid date format: "invalid-date"',
      raw_value: 'invalid-date',
    },
  ],
};

const mockCommitResponse: BankStatementImportCommitResponse = {
  account_id: 'acc-savings-1',
  filename: 'bank_statement.csv',
  file_hash: 'hash-abc-1234567890',
  detected_format: 'debit_credit',
  total_rows: 3,
  valid_rows: 2,
  invalid_rows: 1,
  imported_rows: 2,
  duplicate_rows: 0,
  skipped_rows: 0,
  duplicate_policy_applied: 'skip_duplicates',
  validation_errors: [
    {
      row_number: 3,
      field_name: 'Date',
      error_message: 'Invalid date format: "invalid-date"',
      raw_value: 'invalid-date',
    },
  ],
};

describe('Bank Statement Import Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('mock-token-123');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(accountsApi, 'list').mockResolvedValue(mockAccounts);
    vi.spyOn(transactionsApi, 'list').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 50,
      pages: 1,
    });
  });

  it('uploads CSV, shows preview with detected format and validation warnings, and commits import', async () => {
    const previewSpy = vi.spyOn(bankImportApi, 'preview').mockResolvedValue(mockPreviewResponse);
    const commitSpy = vi.spyOn(bankImportApi, 'commit').mockResolvedValue(mockCommitResponse);

    const onClose = vi.fn();

    render(
      <FinanceProvider>
        <ImportStatementModal isOpen={true} onClose={onClose} defaultAccountId="acc-savings-1" />
      </FinanceProvider>
    );

    // Initial step: Upload CSV Statement
    expect(screen.getByText('Import Bank Statement')).toBeInTheDocument();
    expect(screen.getByText(/Click to choose or drag & drop CSV statement/i)).toBeInTheDocument();

    // Create a mock CSV file
    const file = new File(
      ['Date,Description,Debit,Credit\n15/09/2026,Swiggy,450.00,\n16/09/2026,Salary,,75000.00\n'],
      'bank_statement.csv',
      { type: 'text/csv' }
    );

    // Trigger file upload input
    const fileInput = screen.getByTestId('csv-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verify preview API was called
    await waitFor(() => {
      expect(previewSpy).toHaveBeenCalledTimes(1);
    });

    // Verify step 2: Preview & Configuration is shown
    await waitFor(() => {
      expect(screen.getByText('Debit/Credit Columns')).toBeInTheDocument();
      expect(screen.getByText('bank_statement.csv')).toBeInTheDocument();
      expect(screen.getByText('Swiggy')).toBeInTheDocument();
      expect(screen.getByText('Salary Inflow')).toBeInTheDocument();
    });

    // Check row validation warning is displayed
    expect(screen.getByText(/1 Row Validation Warning\(s\)/i)).toBeInTheDocument();

    // Change duplicate policy to abort_on_duplicate
    const abortRadio = screen.getByDisplayValue('abort_on_duplicate');
    fireEvent.click(abortRadio);

    // Commit the import
    const commitButton = screen.getByRole('button', { name: /Confirm & Ingest 2 Rows/i });
    expect(commitButton).toBeInTheDocument();
    fireEvent.click(commitButton);

    // Verify commit API was called with expected payload
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-savings-1',
          expectedFileHash: 'hash-abc-1234567890',
          duplicatePolicy: 'abort_on_duplicate',
        })
      );
    });

    // Verify modal closes and notifies onClose on completion
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('rejects files larger than 4MB with a clear validation error', async () => {
    const previewSpy = vi.spyOn(bankImportApi, 'preview');
    const onClose = vi.fn();

    render(
      <FinanceProvider>
        <ImportStatementModal isOpen={true} onClose={onClose} />
      </FinanceProvider>
    );

    // Create a large mock file (5MB)
    const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large_statement.csv', { type: 'text/csv' });

    const fileInput = screen.getByTestId('csv-file-input');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/File size exceeds maximum allowed limit of 4MB/i)).toBeInTheDocument();
    });

    expect(previewSpy).not.toHaveBeenCalled();
  });

  it('handles backend preview error gracefully and displays error banner', async () => {
    vi.spyOn(bankImportApi, 'preview').mockRejectedValue(new Error('Unrecognized CSV statement headers'));

    render(
      <FinanceProvider>
        <ImportStatementModal isOpen={true} onClose={vi.fn()} />
      </FinanceProvider>
    );

    const file = new File(['garbage,columns\n1,2\n'], 'bad.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('csv-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Unrecognized CSV statement headers/i)).toBeInTheDocument();
    });
  });
});
