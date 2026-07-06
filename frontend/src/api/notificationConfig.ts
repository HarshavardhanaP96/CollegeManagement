import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface NotificationConfigDto {
  id?: string;
  tenantId?: string;
  
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

export async function getNotificationConfig(collegeId: string): Promise<ApiResponse<NotificationConfigDto>> {
  const { data } = await apiClient.get<ApiResponse<NotificationConfigDto>>(`/institutions/${collegeId}/notification-config`);
  return data;
}

export async function updateNotificationConfig(collegeId: string, payload: NotificationConfigRequest): Promise<ApiResponse<NotificationConfigDto>> {
  const { data } = await apiClient.put<ApiResponse<NotificationConfigDto>>(`/institutions/${collegeId}/notification-config`, payload);
  return data;
}
