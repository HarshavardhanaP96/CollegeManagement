import { apiClient } from './client';
import type { ApiResponse } from './department';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE';

export interface AuditLogEntry {
  id: number;
  collegeId: number;
  actorUserId?: number;
  actorUsername?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  /** JSON string: field -> value (create) or field -> {from,to} (update). */
  changes?: string;
  createdAt: string;
}

export interface AuditLogPageResponse {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuditLogFilters {
  action?: AuditAction;
  entityType?: string;
  from?: string;
  to?: string;
  page: number;
  size: number;
}

export async function getAuditLog(filters: AuditLogFilters): Promise<ApiResponse<AuditLogPageResponse>> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const { data } = await apiClient.get<ApiResponse<AuditLogPageResponse>>('/audit-logs', { params });
  return data;
}
