import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyAuditTab } from './PrivacyAuditTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const entry = (auditId: number, action: string) => ({
  auditId, collegeId: 7, actorId: 99, subjectUserId: 42, action, details: 'requestId=3', createdAt: '2026-10-18T10:00:00',
});
const page = (content: unknown[], totalPages: number) =>
  ({ success: true, message: '', timestamp: '', data: { content, totalElements: content.length, totalPages, number: 0, size: 50 } }) as never;

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PrivacyAuditTab', () => {
  it('lists audit entries', async () => {
    vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(page([entry(2, 'ERASURE_EXECUTED'), entry(1, 'REQUEST_SUBMITTED')], 1));
    renderWithProviders(<PrivacyAuditTab />);

    expect(await screen.findByText('ERASURE_EXECUTED')).toBeInTheDocument();
    expect(screen.getByText('REQUEST_SUBMITTED')).toBeInTheDocument();
  });

  it('pages through the trail', async () => {
    vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(page([entry(1, 'REQUEST_SUBMITTED')], 2));
    const user = userEvent.setup();
    renderWithProviders(<PrivacyAuditTab />);

    await user.click(await screen.findByRole('button', { name: 'Next' }));

    await waitFor(() => expect(privacy.getPrivacyAudit).toHaveBeenLastCalledWith(1));
  });

  it('says so when the trail is empty', async () => {
    vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(page([], 1));
    renderWithProviders(<PrivacyAuditTab />);
    expect(await screen.findByText('No privacy activity recorded yet.')).toBeInTheDocument();
  });
});
