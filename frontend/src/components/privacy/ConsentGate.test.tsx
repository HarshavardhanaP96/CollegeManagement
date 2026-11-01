import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentGate } from './ConsentGate';
import { renderWithProviders } from '../../test/renderWithProviders';
import { useAuthStore } from '../../store/authStore';
import * as privacy from '../../api/privacy';

vi.mock('../../api/privacy');

const purposes = [
  { purposeId: 1, code: 'ACADEMIC_RECORDS', name: 'Academic records', description: 'Needed to run your course.', legalBasis: 'LEGITIMATE_USE', withdrawable: false, status: null, recordedAt: null },
  { purposeId: 2, code: 'EMAIL_SMS_COMMS', name: 'Email and SMS communications', description: 'Notices by email or SMS.', legalBasis: 'CONSENT', withdrawable: true, status: null, recordedAt: null },
  { purposeId: 3, code: 'PARENT_NOTIFICATIONS', name: 'Notifications to parent or guardian', description: 'Alerts to your guardian.', legalBasis: 'CONSENT', withdrawable: true, status: null, recordedAt: null },
];

function notice(requiresAction: boolean) {
  return {
    success: true, message: '', timestamp: '',
    data: { noticeId: 10, version: 2, body: 'We process your data to run the college.', effectiveFrom: '2026-10-01T00:00:00', requiresAction, purposes },
  };
}

function signInAs(roleName: string) {
  useAuthStore.setState({ user: { roleName } as never, isAuthenticated: true });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.recordConsent).mockResolvedValue({ success: true, message: '', timestamp: '', data: purposes[1] } as never);
});

describe('ConsentGate', () => {
  it('stays out of the way of roles that are not data principals', async () => {
    signInAs('COLLEGEADMIN');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);

    renderWithProviders(<ConsentGate />);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(privacy.getCurrentNotice).not.toHaveBeenCalled();
    expect(screen.queryByText(/We process your data/)).not.toBeInTheDocument();
  });

  it('shows nothing when no answer is needed', async () => {
    signInAs('STUDENT');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(false) as never);

    renderWithProviders(<ConsentGate />);

    await waitFor(() => expect(privacy.getCurrentNotice).toHaveBeenCalled());
    expect(screen.queryByText(/We process your data/)).not.toBeInTheDocument();
  });

  it('presents the notice with an unticked box per consent purpose and no box for required processing', async () => {
    signInAs('STUDENT');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);

    renderWithProviders(<ConsentGate />);

    expect(await screen.findByText('We process your data to run the college.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Email and SMS communications/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Notifications to parent or guardian/ })).not.toBeChecked();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.getByText('Academic records')).toBeInTheDocument();
  });

  it('records an explicit answer for every consent purpose and nothing for required processing', async () => {
    const user = userEvent.setup();
    signInAs('TEACHER');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);
    renderWithProviders(<ConsentGate />);

    await user.click(await screen.findByRole('checkbox', { name: /Email and SMS communications/ }));
    await user.click(screen.getByRole('button', { name: 'Save my choices' }));

    await waitFor(() => expect(privacy.recordConsent).toHaveBeenCalledTimes(2));
    expect(privacy.recordConsent).toHaveBeenCalledWith(2, 'GRANTED');
    expect(privacy.recordConsent).toHaveBeenCalledWith(3, 'WITHDRAWN');
    expect(privacy.recordConsent).not.toHaveBeenCalledWith(1, expect.anything());
  });

  it('shows the server error and keeps the gate closed to the app when saving fails', async () => {
    const user = userEvent.setup();
    signInAs('STUDENT');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);
    vi.mocked(privacy.recordConsent).mockRejectedValue(new Error('Server unavailable'));
    renderWithProviders(<ConsentGate />);

    await user.click(await screen.findByRole('button', { name: 'Save my choices' }));

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(screen.getByText('We process your data to run the college.')).toBeInTheDocument();
  });
});
