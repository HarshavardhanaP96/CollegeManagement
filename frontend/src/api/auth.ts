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
    user: AuthUser;
  };
  timestamp: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}



