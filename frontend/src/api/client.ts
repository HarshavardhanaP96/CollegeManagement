import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorPayload {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  statusCode?: number;
  path?: string;
  timestamp?: string;
}

export function getErrorMessage(error: unknown): { message: string; fieldErrors?: Record<string, string> } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    if (data) {
      return { message: data.message ?? 'Request failed', fieldErrors: data.errors };
    }
    return { message: error.message || 'Network error' };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Unexpected error' };
}



