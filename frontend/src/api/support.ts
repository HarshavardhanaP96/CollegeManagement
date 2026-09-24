import { apiClient } from './client';

export interface SupportRequest {
  subject: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function submitSupportRequest(payload: SupportRequest): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/support', payload);
  return data;
}
