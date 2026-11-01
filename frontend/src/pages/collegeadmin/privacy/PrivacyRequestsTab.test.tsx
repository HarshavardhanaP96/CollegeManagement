import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyRequestsTab } from './PrivacyRequestsTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const page = (content: unknown[]) =>
  ({ success: true, message: '', timestamp: '', data: { content, totalElements: content.length, totalPages: 1, number: 0, size: 20 } }) as never;

const row = (requestId: number, overrides: object = {}) => ({
  requestId, userId: 40 + requestId, type: 'ERASURE', status: 'SUBMITTED', details: null,
  submittedAt: '2026-09-01T10:00:00', dueAt: '2026-10-01T10:00:00', resolvedAt: null, resolutionNote: null, overdue: false,
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getAdminRequests).mockResolvedValue(page([row(1, { overdue: true }), row(2)]));
});

describe('PrivacyRequestsTab', () => {
  it('lists requests, flags only the overdue ones and links to the detail page', async () => {
    renderWithProviders(<PrivacyRequestsTab />);

    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getAllByText('Overdue')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Open' })[0]).toHaveAttribute('href', '/privacy-admin/requests/1');
  });

  it('filters by status and by overdue', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRequestsTab />);
    await screen.findByText('#1');

    await user.selectOptions(screen.getByLabelText('Status'), 'IN_REVIEW');
    await waitFor(() =>
      expect(privacy.getAdminRequests).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'IN_REVIEW' })),
    );

    await user.click(screen.getByLabelText('Overdue only'));
    await waitFor(() =>
      expect(privacy.getAdminRequests).toHaveBeenLastCalledWith(expect.objectContaining({ overdue: true })),
    );
  });

  it('says so when there is nothing to show', async () => {
    vi.mocked(privacy.getAdminRequests).mockResolvedValue(page([]));
    renderWithProviders(<PrivacyRequestsTab />);
    expect(await screen.findByText('No requests match these filters.')).toBeInTheDocument();
  });

  it('disables the status filter while Overdue only is ticked and says why', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRequestsTab />);
    await screen.findByText('#1');

    expect(screen.getByLabelText('Status')).toBeEnabled();
    await user.click(screen.getByLabelText('Overdue only'));

    expect(screen.getByLabelText('Status')).toBeDisabled();
    expect(screen.getByText('Overdue only ignores the status filter')).toBeInTheDocument();
  });
});
