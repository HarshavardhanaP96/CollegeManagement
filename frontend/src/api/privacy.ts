import { apiClient } from './client';
import type { ApiResponse } from './notificationConfig';

export type LegalBasis = 'CONSENT' | 'LEGITIMATE_USE';
export type ConsentStatus = 'GRANTED' | 'WITHDRAWN';
export type RequestType = 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'GRIEVANCE';
export type RequestStatus =
  | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'REJECTED' | 'CANCELLED';
export type ResolveOutcome = 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'REJECTED';

// Shapes match com.edgepoint.privacy.dto.* and the entities returned by PrivacyAdminController.
export interface PurposeView {
  purposeId: number;
  code: string;
  name: string;
  description: string | null;
  legalBasis: LegalBasis;
  withdrawable: boolean;
  status: ConsentStatus | null;
  recordedAt: string | null;
}

export interface NoticeView {
  noticeId: number | null;
  version: number | null;
  body: string | null;
  effectiveFrom: string | null;
  requiresAction: boolean;
  purposes: PurposeView[];
}

export interface DataRequestView {
  requestId: number;
  userId: number;
  type: RequestType;
  status: RequestStatus;
  details: string | null;
  submittedAt: string;
  dueAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  overdue: boolean;
}

export interface RequestEventView {
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  actorId: number | null;
  note: string | null;
  occurredAt: string;
}

export interface DataRequestDetail {
  request: DataRequestView;
  correctionPayload: string | null;
  events: RequestEventView[];
}

export interface CreateRequestBody {
  type: RequestType;
  details?: string;
  correction?: Record<string, string>;
}

export interface PrivacyNotice {
  noticeId: number;
  collegeId: number;
  version: number;
  body: string;
  effectiveFrom: string;
  publishedBy: number | null;
}

export interface RetentionPolicyInput {
  dataCategory: string;
  retentionDays: number;
  triggerEvent: 'ACCOUNT_DEACTIVATED';
  action: 'ANONYMISE';
  enabled: boolean;
}

export interface RetentionPolicy extends RetentionPolicyInput {
  policyId: number;
  collegeId: number;
}

export interface RetentionRun {
  runId: number;
  collegeId: number;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  recordsFailed: number;
}

export interface PrivacyAuditEntry {
  auditId: number;
  collegeId: number;
  actorId: number | null;
  subjectUserId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface QueueFilters {
  status?: RequestStatus;
  overdue?: boolean;
  page?: number;
}

type Envelope<T> = Promise<ApiResponse<T>>;

// ---- principal side
export async function getCurrentNotice(): Envelope<NoticeView> {
  const { data } = await apiClient.get<ApiResponse<NoticeView>>('/privacy/notice/current');
  return data;
}

export async function recordConsent(purposeId: number, status: ConsentStatus): Envelope<PurposeView> {
  const { data } = await apiClient.post<ApiResponse<PurposeView>>('/privacy/consents', { purposeId, status });
  return data;
}

export async function createRequest(body: CreateRequestBody): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>('/privacy/requests', body);
  return data;
}

export async function getMyRequests(): Envelope<DataRequestView[]> {
  const { data } = await apiClient.get<ApiResponse<DataRequestView[]>>('/privacy/requests/me');
  return data;
}

export async function getMyRequest(id: number): Envelope<DataRequestDetail> {
  const { data } = await apiClient.get<ApiResponse<DataRequestDetail>>(`/privacy/requests/${id}`);
  return data;
}

export async function cancelRequest(id: number): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>(`/privacy/requests/${id}/cancel`);
  return data;
}

export async function downloadExport(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/privacy/requests/${id}/export`, { responseType: 'blob' });
  return data;
}

// ---- admin side
export async function getAdminRequests(filters: QueueFilters): Envelope<Page<DataRequestView>> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.status) params.status = filters.status;
  if (filters.overdue) params.overdue = true;
  if (filters.page) params.page = filters.page;
  const { data } = await apiClient.get<ApiResponse<Page<DataRequestView>>>('/privacy/admin/requests', { params });
  return data;
}

export async function getAdminRequest(id: number): Envelope<DataRequestDetail> {
  const { data } = await apiClient.get<ApiResponse<DataRequestDetail>>(`/privacy/admin/requests/${id}`);
  return data;
}

export async function reviewRequest(id: number): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>(`/privacy/admin/requests/${id}/review`);
  return data;
}

export async function resolveRequest(
  id: number,
  body: { outcome: ResolveOutcome; note: string },
): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>(`/privacy/admin/requests/${id}/resolve`, body);
  return data;
}

export async function getNotices(): Envelope<PrivacyNotice[]> {
  const { data } = await apiClient.get<ApiResponse<PrivacyNotice[]>>('/privacy/admin/notices');
  return data;
}

export async function publishNotice(body: string): Envelope<PrivacyNotice> {
  const { data } = await apiClient.post<ApiResponse<PrivacyNotice>>('/privacy/admin/notices', { body });
  return data;
}

export async function getRetentionPolicies(): Envelope<RetentionPolicy[]> {
  const { data } = await apiClient.get<ApiResponse<RetentionPolicy[]>>('/privacy/admin/retention-policies');
  return data;
}

export async function saveRetentionPolicies(policies: RetentionPolicyInput[]): Envelope<RetentionPolicy[]> {
  const { data } = await apiClient.put<ApiResponse<RetentionPolicy[]>>('/privacy/admin/retention-policies', policies);
  return data;
}

export async function runRetention(dryRun: boolean): Envelope<RetentionRun> {
  const { data } = await apiClient.post<ApiResponse<RetentionRun>>('/privacy/admin/retention/run', null, {
    params: { dryRun },
  });
  return data;
}

export async function getRetentionRuns(): Envelope<Page<RetentionRun>> {
  const { data } = await apiClient.get<ApiResponse<Page<RetentionRun>>>('/privacy/admin/retention/runs');
  return data;
}

export async function getPrivacyAudit(page: number): Envelope<Page<PrivacyAuditEntry>> {
  const { data } = await apiClient.get<ApiResponse<Page<PrivacyAuditEntry>>>('/privacy/admin/audit', {
    params: page ? { page } : {},
  });
  return data;
}
