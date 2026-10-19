import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import {
  cancelRequest, createRequest, downloadExport, getAdminRequests, getCurrentNotice, getMyRequests,
  publishNotice, recordConsent, resolveRequest, reviewRequest, runRetention, saveRetentionPolicies,
} from './privacy';

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const ok = (data: unknown) => ({ data: { success: true, message: '', timestamp: '', data } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiClient.get).mockResolvedValue(ok([]));
  vi.mocked(apiClient.post).mockResolvedValue(ok({}));
  vi.mocked(apiClient.put).mockResolvedValue(ok([]));
});

describe('privacy api', () => {
  it('reads the current notice and returns the unwrapped envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(ok({ noticeId: 1 }));
    const res = await getCurrentNotice();
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/notice/current');
    expect(res.data).toEqual({ noticeId: 1 });
  });

  it('records a consent decision', async () => {
    await recordConsent(2, 'GRANTED');
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/consents', { purposeId: 2, status: 'GRANTED' });
  });

  it('creates, lists and cancels my requests', async () => {
    await createRequest({ type: 'GRIEVANCE', details: 'x' });
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/requests', { type: 'GRIEVANCE', details: 'x' });
    await getMyRequests();
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/requests/me');
    await cancelRequest(9);
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/requests/9/cancel');
  });

  it('downloads an export as a blob', async () => {
    const blob = new Blob(['{}']);
    vi.mocked(apiClient.get).mockResolvedValue({ data: blob });
    expect(await downloadExport(4)).toBe(blob);
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/requests/4/export', { responseType: 'blob' });
  });

  it('passes queue filters as query params and drops empty ones', async () => {
    await getAdminRequests({ status: 'IN_REVIEW', overdue: true, page: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/admin/requests', {
      params: { status: 'IN_REVIEW', overdue: true, page: 2 },
    });
    await getAdminRequests({});
    expect(apiClient.get).toHaveBeenLastCalledWith('/privacy/admin/requests', { params: {} });
  });

  it('reviews and resolves a request', async () => {
    await reviewRequest(3);
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/requests/3/review');
    await resolveRequest(3, { outcome: 'REJECTED', note: 'No' });
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/requests/3/resolve', { outcome: 'REJECTED', note: 'No' });
  });

  it('publishes a notice, saves policies and runs retention', async () => {
    await publishNotice('text');
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/notices', { body: 'text' });
    const policy = { dataCategory: 'ACCOUNT_RECORDS', retentionDays: 30, triggerEvent: 'ACCOUNT_DEACTIVATED' as const, action: 'ANONYMISE' as const, enabled: true };
    await saveRetentionPolicies([policy]);
    expect(apiClient.put).toHaveBeenCalledWith('/privacy/admin/retention-policies', [policy]);
    await runRetention(true);
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/retention/run', null, { params: { dryRun: true } });
  });
});
