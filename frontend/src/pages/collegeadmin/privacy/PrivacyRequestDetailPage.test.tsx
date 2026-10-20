import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Route, Routes } from 'react-router-dom';
import { PrivacyRequestDetailPage } from './PrivacyRequestDetailPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

function detail(overrides: object = {}, extra: object = {}) {
  return {
    success: true, message: '', timestamp: '',
    data: {
      request: {
        requestId: 5, userId: 42, type: 'ACCESS', status: 'IN_REVIEW', details: 'Please send my data',
        submittedAt: '2026-10-01T10:00:00', dueAt: '2026-10-31T10:00:00', resolvedAt: null, resolutionNote: null, overdue: false,
        ...overrides,
      },
      correctionPayload: null,
      events: [{ fromStatus: null, toStatus: 'SUBMITTED', actorId: 42, note: null, occurredAt: '2026-10-01T10:00:00' }],
      ...extra,
    },
  } as never;
}

function show() {
  return renderWithProviders(
    <Routes><Route path="/privacy-admin/requests/:id" element={<PrivacyRequestDetailPage />} /></Routes>,
    { route: '/privacy-admin/requests/5' },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.reviewRequest).mockResolvedValue({ success: true, message: '', timestamp: '', data: {} } as never);
  vi.mocked(privacy.resolveRequest).mockResolvedValue({ success: true, message: '', timestamp: '', data: {} } as never);
});

describe('PrivacyRequestDetailPage', () => {
  it('lets the admin start a review of a submitted request and offers no resolution yet', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ status: 'SUBMITTED' }));
    const user = userEvent.setup();
    show();

    await user.click(await screen.findByRole('button', { name: 'Start review' }));

    await waitFor(() => expect(privacy.reviewRequest).toHaveBeenCalledWith(5));
    expect(screen.queryByRole('button', { name: 'Resolve request' })).not.toBeInTheDocument();
  });

  it('requires a note before resolving and then sends the chosen outcome', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    const user = userEvent.setup();
    show();

    const resolve = await screen.findByRole('button', { name: 'Resolve request' });
    expect(resolve).toBeDisabled();

    await user.type(screen.getByLabelText('Resolution note'), 'Sent by email');
    expect(resolve).toBeEnabled();
    await user.click(resolve);

    await waitFor(() => expect(privacy.resolveRequest).toHaveBeenCalledWith(5, { outcome: 'COMPLETED', note: 'Sent by email' }));
  });

  it('does not offer partial completion for requests other than erasure', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    show();
    await screen.findByRole('button', { name: 'Resolve request' });
    expect(screen.queryByRole('option', { name: /Partially completed/ })).not.toBeInTheDocument();
  });

  it('makes the admin confirm an irreversible erasure, but not a rejection', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ type: 'ERASURE' }));
    const user = userEvent.setup();
    show();

    expect(await screen.findByText(/anonymises the person's name/)).toBeInTheDocument();
    const resolve = screen.getByRole('button', { name: 'Resolve request' });
    await user.type(screen.getByLabelText('Resolution note'), 'Academic records retained');
    expect(resolve).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Outcome'), 'PARTIALLY_COMPLETED');
    await user.click(screen.getByLabelText(/I understand this cannot be undone/));
    expect(resolve).toBeEnabled();
    await user.click(resolve);
    await waitFor(() =>
      expect(privacy.resolveRequest).toHaveBeenCalledWith(5, { outcome: 'PARTIALLY_COMPLETED', note: 'Academic records retained' }),
    );
  });

  it('lets a rejection through without the confirmation', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ type: 'ERASURE' }));
    const user = userEvent.setup();
    show();

    await user.selectOptions(await screen.findByLabelText('Outcome'), 'REJECTED');
    await user.type(screen.getByLabelText('Resolution note'), 'Identity not verified');

    expect(screen.getByRole('button', { name: 'Resolve request' })).toBeEnabled();
  });

  it('shows the requested correction and the history', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(
      detail({ type: 'CORRECTION' }, { correctionPayload: '{"phone":"8888888888"}' }),
    );
    show();

    expect(await screen.findByText('phone')).toBeInTheDocument();
    expect(screen.getByText('8888888888')).toBeInTheDocument();
    expect(screen.getByText(/submitted/i, { selector: 'li span' })).toBeInTheDocument();
  });

  it('shows the outcome of a finished request and no actions', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(
      detail({ status: 'REJECTED', resolutionNote: 'Identity not verified' }),
    );
    show();

    expect(await screen.findByText('Identity not verified')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve request' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument();
  });

  it('shows the server error when resolving fails', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    vi.mocked(privacy.resolveRequest).mockRejectedValue(new Error('You cannot act on your own request'));
    const user = userEvent.setup();
    show();

    await user.type(await screen.findByLabelText('Resolution note'), 'ok');
    await user.click(screen.getByRole('button', { name: 'Resolve request' }));

    expect(await screen.findByText('You cannot act on your own request')).toBeInTheDocument();
  });

  it('resets the confirmation when the outcome changes', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ type: 'ERASURE' }));
    const user = userEvent.setup();
    show();

    const resolve = await screen.findByRole('button', { name: 'Resolve request' });
    await user.type(screen.getByLabelText('Resolution note'), 'note');
    await user.click(screen.getByLabelText(/I understand this cannot be undone/));
    expect(resolve).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Outcome'), 'REJECTED');
    await user.selectOptions(screen.getByLabelText('Outcome'), 'COMPLETED');
    expect(resolve).toBeDisabled();
  });

  it('cannot resolve twice while the refresh is in flight', async () => {
    vi.mocked(privacy.getAdminRequest)
      .mockResolvedValueOnce(detail())
      .mockImplementation(() => new Promise((r) => setTimeout(() => r(detail({ status: 'COMPLETED' })), 50)));
    const user = userEvent.setup();
    show();

    await user.type(await screen.findByLabelText('Resolution note'), 'done');
    const resolve = screen.getByRole('button', { name: 'Resolve request' });
    await user.click(resolve);
    await user.click(resolve);

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Resolve request' })).not.toBeInTheDocument());
    expect(privacy.resolveRequest).toHaveBeenCalledTimes(1);
  });

  it('does not carry a typed note over to another request', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Link to="/privacy-admin/requests/6">Next request</Link>
        <Routes><Route path="/privacy-admin/requests/:id" element={<PrivacyRequestDetailPage />} /></Routes>
      </>,
      { route: '/privacy-admin/requests/5' },
    );

    await user.type(await screen.findByLabelText('Resolution note'), 'stale note');
    await user.click(screen.getByRole('link', { name: 'Next request' }));

    await waitFor(() => expect(privacy.getAdminRequest).toHaveBeenCalledWith(6));
    expect(await screen.findByLabelText('Resolution note')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Resolve request' })).toBeDisabled();
  });
});
