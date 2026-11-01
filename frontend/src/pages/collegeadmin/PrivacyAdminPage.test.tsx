import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyAdminPage } from './PrivacyAdminPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import * as privacy from '../../api/privacy';

vi.mock('../../api/privacy');

const emptyPage = { success: true, message: '', timestamp: '', data: { content: [], totalElements: 0, totalPages: 1, number: 0, size: 20 } } as never;
const emptyList = { success: true, message: '', timestamp: '', data: [] } as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getAdminRequests).mockResolvedValue(emptyPage);
  vi.mocked(privacy.getNotices).mockResolvedValue(emptyList);
  vi.mocked(privacy.getRetentionPolicies).mockResolvedValue(emptyList);
  vi.mocked(privacy.getRetentionRuns).mockResolvedValue(emptyPage);
  vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(emptyPage);
});

describe('PrivacyAdminPage', () => {
  it('opens on the request queue and switches between the four tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyAdminPage />);

    expect(await screen.findByRole('heading', { name: 'Request queue' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Privacy notice' }));
    expect(await screen.findByRole('heading', { name: 'Publish a new version' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retention' }));
    expect(await screen.findByRole('heading', { name: 'Run retention' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Audit log' }));
    expect(await screen.findByText('No privacy activity recorded yet.')).toBeInTheDocument();
  });
});
