import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyRetentionTab } from './PrivacyRetentionTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const envelope = (data: unknown) => ({ success: true, message: '', timestamp: '', data }) as never;

const policy = {
  policyId: 1, collegeId: 7, dataCategory: 'ACCOUNT_RECORDS', retentionDays: 1825,
  triggerEvent: 'ACCOUNT_DEACTIVATED', action: 'ANONYMISE', enabled: false,
};
const run = (runId: number, dryRun: boolean, processed: number, failed = 0) => ({
  runId, collegeId: 7, dryRun, startedAt: '2026-10-18T02:30:00', finishedAt: '2026-10-18T02:31:00',
  status: 'COMPLETED', recordsProcessed: processed, recordsFailed: failed,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getRetentionPolicies).mockResolvedValue(envelope([policy]));
  vi.mocked(privacy.getRetentionRuns).mockResolvedValue(envelope({ content: [run(2, true, 3)], totalElements: 1, totalPages: 1, number: 0, size: 20 }));
  vi.mocked(privacy.saveRetentionPolicies).mockResolvedValue(envelope([policy]));
  vi.mocked(privacy.runRetention).mockResolvedValue(envelope(run(3, true, 4)));
});

describe('PrivacyRetentionTab', () => {
  it('shows the shipped policy as disabled with its placeholder period', async () => {
    renderWithProviders(<PrivacyRetentionTab />);

    expect(await screen.findByLabelText('Retention period (days)')).toHaveValue(1825);
    expect(screen.getByLabelText('Enabled')).not.toBeChecked();
  });

  it('saves an edited period and the enabled switch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const days = await screen.findByLabelText('Retention period (days)');
    await user.clear(days);
    await user.type(days, '400');
    await user.click(screen.getByLabelText('Enabled'));
    await user.click(screen.getByRole('button', { name: 'Save policy' }));

    await waitFor(() =>
      expect(privacy.saveRetentionPolicies).toHaveBeenCalledWith([
        { dataCategory: 'ACCOUNT_RECORDS', retentionDays: 400, triggerEvent: 'ACCOUNT_DEACTIVATED', action: 'ANONYMISE', enabled: true },
      ]),
    );
  });

  it('refuses a period that is not a positive whole number', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const days = await screen.findByLabelText('Retention period (days)');
    await user.clear(days);
    await user.type(days, '0');
    await user.click(screen.getByRole('button', { name: 'Save policy' }));

    expect(await screen.findByText('Retention period must be a whole number of days, at least 1')).toBeInTheDocument();
    expect(privacy.saveRetentionPolicies).not.toHaveBeenCalled();
  });

  it('previews with a dry run and reports how many accounts would change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    await user.click(await screen.findByRole('button', { name: 'Preview (dry run)' }));

    await waitFor(() => expect(privacy.runRetention).toHaveBeenCalledWith(true));
    expect(await screen.findByText('Dry run: 4 account(s) would be anonymised.')).toBeInTheDocument();
  });

  it('keeps the live run locked until the admin confirms', async () => {
    vi.mocked(privacy.runRetention).mockResolvedValue(envelope(run(4, false, 2, 1)));
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const live = await screen.findByRole('button', { name: 'Run now (live)' });
    expect(live).toBeDisabled();

    await user.click(screen.getByLabelText(/I understand a live run permanently anonymises accounts/));
    expect(live).toBeEnabled();
    await user.click(live);

    await waitFor(() => expect(privacy.runRetention).toHaveBeenCalledWith(false));
    expect(await screen.findByText('Anonymised 2 account(s); 1 failed.')).toBeInTheDocument();
  });

  it('lists the run history', async () => {
    renderWithProviders(<PrivacyRetentionTab />);
    expect(await screen.findByText('Dry run')).toBeInTheDocument();
  });

  it('keeps the live run locked while a dry run is pending', async () => {
    vi.mocked(privacy.runRetention).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    await user.click(await screen.findByLabelText(/I understand a live run permanently anonymises accounts/));
    await user.click(screen.getByRole('button', { name: 'Preview (dry run)' }));

    await waitFor(() => expect(privacy.runRetention).toHaveBeenCalledWith(true));
    expect(screen.getByRole('button', { name: /Run now \(live\)/ })).toBeDisabled();
  });

  it('re-locks the live run after it fails', async () => {
    vi.mocked(privacy.runRetention).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const box = await screen.findByLabelText(/I understand a live run permanently anonymises accounts/);
    await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Run now (live)' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(box).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Run now (live)' })).toBeDisabled();
  });
});
