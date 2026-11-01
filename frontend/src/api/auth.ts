import { apiClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  roleId: number;
  roleName: string;
  collegeId?: number;
  collegeName?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
    user: AuthUser;
  };
  timestamp: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

// Tokens are passed in because the caller clears localStorage before the request interceptor runs.
export async function logout(accessToken: string | null, refreshToken: string | null): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>(
    '/auth/logout',
    refreshToken ? { refreshToken } : undefined,
    accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  );
  return data;
}

export async function changePassword(payload: ChangePasswordRequest): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/change-password', payload);
  return data;
}

export async function refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<{ accessToken: string; tokenType: string; expiresIn: number }>> {
  const { data } = await apiClient.post<ApiResponse<{ accessToken: string; tokenType: string; expiresIn: number }>>('/auth/refresh-token', payload);
  return data;
}
