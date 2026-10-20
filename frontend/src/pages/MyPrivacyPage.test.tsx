import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyPrivacyPage } from './MyPrivacyPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { useAuthStore } from '../store/authStore';
import * as privacy from '../api/privacy';

vi.mock('../api/privacy');

const envelope = (data: unknown) => ({ success: true, message: '', timestamp: '', data }) as never;

const base = {
  userId: 5, details: null, resolvedAt: null, resolutionNote: null, overdue: false,
  submittedAt: '2026-10-01T10:00:00', dueAt: '2026-10-31T10:00:00',
};

const requests = [
  { ...base, requestId: 1, type: 'ACCESS', status: 'SUBMITTED' },
  { ...base, requestId: 2, type: 'ACCESS', status: 'COMPLETED' },
  { ...base, requestId: 3, type: 'ERASURE', status: 'IN_REVIEW' },
];

const notice = {
  noticeId: 10, version: 2, body: 'Notice text', effectiveFrom: '2026-10-01T00:00:00', requiresAction: false,
  purposes: [
    { purposeId: 1, code: 'ACADEMIC_RECORDS', name: 'Academic records', description: null, legalBasis: 'LEGITIMATE_USE', withdrawable: false, status: null, recordedAt: null },
    { purposeId: 2, code: 'EMAIL_SMS_COMMS', name: 'Email and SMS communications', description: null, legalBasis: 'CONSENT', withdrawable: true, status: 'GRANTED', recordedAt: '2026-10-02T00:00:00' },
    { purposeId: 3, code: 'PARENT_NOTIFICATIONS', name: 'Notifications to parent or guardian', description: null, legalBasis: 'CONSENT', withdrawable: true, status: null, recordedAt: null },
  ],
};

function signInAs(roleName: string) {
  useAuthStore.setState({ user: { roleName } as never, isAuthenticated: true });
}

beforeEach(() => {
  vi.resetAllMocks();
  signInAs('STUDENT');
  vi.mocked(privacy.getCurrentNotice).mockResolvedValue(envelope(notice));
  vi.mocked(privacy.getMyRequests).mockResolvedValue(envelope(requests));
  vi.mocked(privacy.createRequest).mockResolvedValue(envelope(requests[0]));
  vi.mocked(privacy.recordConsent).mockResolvedValue(envelope(notice.purposes[1]));
  vi.mocked(privacy.cancelRequest).mockResolvedValue(envelope(requests[0]));
});

describe('MyPrivacyPage', () => {
  it('lists my requests with their status and offers only the actions that apply', async () => {
    renderWithProviders(<MyPrivacyPage />);

    expect(await screen.findByText(/^Request #1 ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Request #2 ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Request #3 ·/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Cancel request' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Download my data' })).toHaveLength(1);
  });

  it('cancels a submitted request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.click(await screen.findByRole('button', { name: 'Cancel request' }));

    await waitFor(() => expect(privacy.cancelRequest).toHaveBeenCalledWith(1));
  });

  it('does not submit a grievance without a description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'GRIEVANCE');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));

    expect(await screen.findByText('Please describe your grievance')).toBeInTheDocument();
    expect(privacy.createRequest).not.toHaveBeenCalled();
  });

  it('submits a correction with the chosen field and value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'CORRECTION');
    await user.selectOptions(screen.getByLabelText('Field to correct'), 'phone');
    await user.type(screen.getByLabelText('New value'), '8888888888');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));

    await waitFor(() =>
      expect(privacy.createRequest).toHaveBeenCalledWith({ type: 'CORRECTION', correction: { phone: '8888888888' } }),
    );
  });

  it('refuses a correction with an empty value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'CORRECTION');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));

    expect(await screen.findByText('Enter the new value')).toBeInTheDocument();
    expect(privacy.createRequest).not.toHaveBeenCalled();
  });

  it('offers a teacher only the fields a teacher can correct', async () => {
    signInAs('TEACHER');
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'CORRECTION');

    const options = within(screen.getByLabelText('Field to correct')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Full name', 'Phone']);
  });

  it('tells an erasure requester that academic records are kept', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'ERASURE');

    expect(screen.getByText(/marks and attendance are kept/i)).toBeInTheDocument();
  });

  it('lets me withdraw a granted consent and give a missing one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.click(await screen.findByRole('button', { name: 'Withdraw consent: Email and SMS communications' }));
    await waitFor(() => expect(privacy.recordConsent).toHaveBeenCalledWith(2, 'WITHDRAWN'));

    await user.click(screen.getByRole('button', { name: 'Give consent: Notifications to parent or guardian' }));
    await waitFor(() => expect(privacy.recordConsent).toHaveBeenCalledWith(3, 'GRANTED'));
  });

  it('shows required processing without any switch', async () => {
    renderWithProviders(<MyPrivacyPage />);
    expect(await screen.findByText('Academic records')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /consent: Academic records/ })).not.toBeInTheDocument();
  });
});
