import { apiClient } from './client';

// Shape matches backend com.edgepoint.notification.dto.NotificationConfigDto exactly (see
// notification.controller.NotificationConfigController#getConfig) — secrets are never sent,
// only *Set booleans indicating whether one is stored.
export interface NotificationConfigDto {
  id?: number;
  collegeId: number;

  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpUseSsl?: boolean;
  smtpEnabled?: boolean;
  smtpPasswordSet?: boolean;

  whatsappApiUrl?: string;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  whatsappEnabled?: boolean;
  whatsappApiKeySet?: boolean;
}

// Matches backend NotificationConfigRequest — omitting smtpPassword/whatsappApiKey (or sending
// blank) leaves the currently stored secret unchanged; SUPERADMIN-only endpoint.
export interface NotificationConfigRequest {
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpUseSsl?: boolean;
  smtpEnabled?: boolean;

  whatsappApiUrl?: string;
  whatsappApiKey?: string;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  whatsappEnabled?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function getNotificationConfig(collegeId: number): Promise<ApiResponse<NotificationConfigDto>> {
  const { data } = await apiClient.get<ApiResponse<NotificationConfigDto>>(`/colleges/${collegeId}/notification-config`);
  return data;
}

export async function updateNotificationConfig(
  collegeId: number,
  payload: NotificationConfigRequest,
): Promise<ApiResponse<NotificationConfigDto>> {
  const { data } = await apiClient.put<ApiResponse<NotificationConfigDto>>(`/colleges/${collegeId}/notification-config`, payload);
  return data;
}
