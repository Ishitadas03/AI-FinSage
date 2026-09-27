import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FinanceProvider } from '@/context/FinanceContext';
import { PWAInstallProvider } from '@/context/PWAInstallContext';
import { Settings } from '@/pages/Settings';
import { usersApi } from '@/lib/api/users';
import { dataManagementApi } from '@/lib/api/dataManagement';
import { authApi } from '@/lib/api/auth';
import { accountsApi } from '@/lib/api/accounts';
import { tokenStorage } from '@/lib/api/tokenStorage';

const mockUser = {
  id: 'usr-1',
  email: 'investor@finsage.io',
  full_name: 'Rahul Sharma',
  created_at: '2026-01-01T00:00:00Z',
};

const mockUserProfile = {
  id: 'usr-1',
  full_name: 'Rahul Sharma',
  email: 'investor@finsage.io',
  phone: '+91 98765 43210',
  pan_number: 'ABCDE1234F',
  currency: 'INR',
  monthly_income: 95000,
  risk_appetite: 'Moderate',
  preferences: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-09-27T00:00:00Z',
};

const mockAuditLogs = {
  logs: [
    {
      id: 'audit-1',
      user_id: 'usr-1',
      action: 'profile_updated',
      category: 'profile',
      ip_address: '127.0.0.1',
      user_agent: 'Vitest Test Agent',
      details: { updated_fields: ['monthly_income'] },
      created_at: '2026-09-27T08:00:00Z',
    },
    {
      id: 'audit-2',
      user_id: 'usr-1',
      action: 'data_exported',
      category: 'data_export',
      ip_address: '127.0.0.1',
      user_agent: 'Vitest Test Agent',
      details: { format: 'json', total_records: 42 },
      created_at: '2026-09-27T09:00:00Z',
    },
  ],
  total: 2,
};

describe('Settings & Data Management Integration (Phase 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.setAccessToken('test-token');

    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser as any);
    vi.spyOn(usersApi, 'getProfile').mockResolvedValue(mockUserProfile as any);
    vi.spyOn(usersApi, 'updateProfile').mockResolvedValue({
      ...mockUserProfile,
      phone: '+91 99999 88888',
      monthly_income: 120000,
    } as any);
    vi.spyOn(accountsApi, 'list').mockResolvedValue([]);
    vi.spyOn(dataManagementApi, 'exportDataJson').mockResolvedValue({
      metadata: {
        exported_at: '2026-09-27T10:00:00Z',
        user_id: 'usr-1',
        email: 'investor@finsage.io',
        format: 'json',
        app_version: '2.0.0',
        total_records: 5,
      },
      profile: mockUserProfile,
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      loans: [],
      recurring_bills: [],
      notifications: [],
    });
    vi.spyOn(dataManagementApi, 'exportDataCsvZip').mockResolvedValue(new Blob(['fake-zip-data']));
    vi.spyOn(dataManagementApi, 'getAuditLogs').mockResolvedValue(mockAuditLogs as any);
    vi.spyOn(dataManagementApi, 'deleteAccount').mockResolvedValue({
      status: 'deleted',
      message: 'Account deleted successfully',
      deleted_at: '2026-09-27T10:00:00Z',
      deleted_user_id: 'usr-1',
    });
  });

  const renderSettings = () =>
    render(
      <BrowserRouter>
        <FinanceProvider>
          <PWAInstallProvider>
            <Settings />
          </PWAInstallProvider>
        </FinanceProvider>
      </BrowserRouter>
    );

  it('renders persistent profile and updates mutable fields', async () => {
    renderSettings();

    // Verify Clerk-managed protected fields are present
    expect(await screen.findByText('Verified Authentication Identity')).toBeInTheDocument();
    expect(screen.getByText('Clerk Managed')).toBeInTheDocument();

    // Verify initial values
    const phoneInput = (await screen.findByLabelText(/Phone Number/i)) as HTMLInputElement;
    await waitFor(() => {
      expect(phoneInput.value).toBe('+91 98765 43210');
    });

    // Change phone number
    fireEvent.change(phoneInput, { target: { value: '+91 99999 88888' } });

    // Submit profile update
    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(usersApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+91 99999 88888',
        })
      );
    });
  });

  it('switches to Data & Privacy tab and triggers JSON & CSV exports', async () => {
    renderSettings();

    // Switch to Data tab
    const dataTabButton = await screen.findByRole('button', { name: /Data & Privacy/i });
    fireEvent.click(dataTabButton);

    expect(await screen.findByText(/Data Portability & Complete Financial Export/i)).toBeInTheDocument();

    // Trigger JSON Export
    const jsonExportButton = screen.getByRole('button', { name: /Structured JSON Export/i });
    fireEvent.click(jsonExportButton);

    await waitFor(() => {
      expect(dataManagementApi.exportDataJson).toHaveBeenCalled();
    });

    // Trigger CSV Zip Export
    const csvExportButton = screen.getByRole('button', { name: /Multi-Table CSV Archive/i });
    fireEvent.click(csvExportButton);

    await waitFor(() => {
      expect(dataManagementApi.exportDataCsvZip).toHaveBeenCalled();
    });
  });

  it('switches to Audit Trail tab and displays immutable security records', async () => {
    renderSettings();

    // Switch to Audit tab
    const auditTabButton = await screen.findByRole('button', { name: /Audit Trail/i });
    fireEvent.click(auditTabButton);

    expect(await screen.findByText(/Security & Data Access Audit Trail/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('profile_updated')).toBeInTheDocument();
      expect(screen.getByText('data_exported')).toBeInTheDocument();
    });
  });

  it('validates and executes account deletion confirmation modal', async () => {
    renderSettings();

    // Switch to Data tab
    const dataTabButton = await screen.findByRole('button', { name: /Data & Privacy/i });
    fireEvent.click(dataTabButton);

    // Open Delete modal
    const deleteButton = await screen.findByRole('button', { name: /Delete My FinSage Account/i });
    fireEvent.click(deleteButton);

    // Verify modal is displayed
    expect(await screen.findByText(/Warning: This action is permanent/i)).toBeInTheDocument();

    // Confirm submit button is initially disabled
    const confirmDeleteButton = screen.getByRole('button', { name: /Permanently Delete Everything/i });
    expect(confirmDeleteButton).toBeDisabled();

    // Fill in email
    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    fireEvent.change(emailInput, { target: { value: 'investor@finsage.io' } });

    // Fill in confirmation text
    const textInput = screen.getByPlaceholderText('DELETE MY ACCOUNT');
    fireEvent.change(textInput, { target: { value: 'DELETE MY ACCOUNT' } });

    // Now button should be enabled
    expect(confirmDeleteButton).not.toBeDisabled();

    // Submit deletion
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(dataManagementApi.deleteAccount).toHaveBeenCalledWith({
        confirm_email: 'investor@finsage.io',
        confirmation_text: 'DELETE MY ACCOUNT',
        reason: 'Closing account',
      });
    });
  });
});
