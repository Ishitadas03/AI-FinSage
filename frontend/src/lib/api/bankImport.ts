import { apiClient } from './client';
import {
  BankStatementCommitParams,
  BankStatementImportCommitResponse,
  BankStatementPreviewResponse,
} from '@/types/bankStatement';

export const bankImportApi = {
  /**
   * Uploads a CSV bank statement and returns a normalized preview, detected format, and validation errors.
   */
  async preview(
    file: File,
    previewLimit: number = 100,
    maxRows: number = 5000
  ): Promise<BankStatementPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<BankStatementPreviewResponse>(
      '/imports/bank-statement/preview',
      formData,
      {
        params: {
          preview_limit: previewLimit,
          max_rows: maxRows,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Commits the bank statement transactions into the specified account, checking duplicate policy and hash integrity.
   */
  async commit(params: BankStatementCommitParams): Promise<BankStatementImportCommitResponse> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('account_id', params.accountId);
    formData.append('expected_file_hash', params.expectedFileHash);
    formData.append('duplicate_policy', params.duplicatePolicy || 'skip_duplicates');
    if (params.maxRows) {
      formData.append('max_rows', String(params.maxRows));
    }

    const response = await apiClient.post<BankStatementImportCommitResponse>(
      '/imports/bank-statement/commit',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
