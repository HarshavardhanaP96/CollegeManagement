import { apiClient } from './client';
import type { ApiResponse } from './notificationConfig';

// Matches backend com.edgepoint.notification.dto.NotificationChannelRuleDto / ...Request.
export type NotificationEventType = 'ATTENDANCE_ABSENCE' | 'MARKS_PUBLISHED' | 'FEE_REMINDER' | 'ANNOUNCEMENT';

export interface NotificationChannelRule {
  eventType: NotificationEventType;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
}

export async function getNotificationChannelRules(collegeId: number): Promise<ApiResponse<NotificationChannelRule[]>> {
  const { data } = await apiClient.get<ApiResponse<NotificationChannelRule[]>>(`/colleges/${collegeId}/notification-channel-rules`);
  return data;
}

export async function updateNotificationChannelRules(
  collegeId: number,
  rules: NotificationChannelRule[],
): Promise<ApiResponse<NotificationChannelRule[]>> {
  const { data } = await apiClient.put<ApiResponse<NotificationChannelRule[]>>(`/colleges/${collegeId}/notification-channel-rules`, rules);
  return data;
}
