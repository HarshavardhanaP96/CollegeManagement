import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyNoticeTab } from './PrivacyNoticeTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const notices = [
  { noticeId: 2, collegeId: 7, version: 2, body: 'Second notice text', effectiveFrom: '2026-10-01T00:00:00', publishedBy: 1 },
  { noticeId: 1, collegeId: 7, version: 1, body: 'First notice text', effectiveFrom: '2026-09-01T00:00:00', publishedBy: 1 },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getNotices).mockResolvedValue({ success: true, message: '', timestamp: '', data: notices } as never);
  vi.mocked(privacy.publishNotice).mockResolvedValue({ success: true, message: '', timestamp: '', data: notices[0] } as never);
});

describe('PrivacyNoticeTab', () => {
  it('shows the current version and lists earlier ones', async () => {
    renderWithProviders(<PrivacyNoticeTab />);

    expect(await screen.findByText('Second notice text')).toBeInTheDocument();
    expect(screen.getByText(/Current notice: version 2/)).toBeInTheDocument();
    expect(screen.getByText(/Version 1/)).toBeInTheDocument();
  });

  it('explains when nothing has been published', async () => {
    vi.mocked(privacy.getNotices).mockResolvedValue({ success: true, message: '', timestamp: '', data: [] } as never);
    renderWithProviders(<PrivacyNoticeTab />);
    expect(await screen.findByText(/No notice has been published yet/)).toBeInTheDocument();
  });

  it('cannot publish empty text and publishes trimmed text otherwise', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyNoticeTab />);
    const publish = await screen.findByRole('button', { name: 'Publish new version' });
    expect(publish).toBeDisabled();

    await user.type(screen.getByLabelText('New notice text'), '  Updated terms  ');
    expect(publish).toBeEnabled();
    await user.click(publish);

    await waitFor(() => expect(privacy.publishNotice).toHaveBeenCalledWith('Updated terms'));
    await waitFor(() => expect(screen.getByLabelText('New notice text')).toHaveValue(''));
  });

  it('warns that publishing asks everyone to answer again', async () => {
    renderWithProviders(<PrivacyNoticeTab />);
    expect(await screen.findByText(/will be asked to review their choices again/)).toBeInTheDocument();
  });
});
