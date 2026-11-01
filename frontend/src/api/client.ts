import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// Request interceptor — attach JWT token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh tokens are single-use (rotated server-side, reuse revokes every session), so concurrent
// 401s must share one refresh call instead of each sending the same token.
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string | null> {
  refreshInFlight ??= axios
    .post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken })
    .then(({ data }) => {
      if (!data.success || !data.data?.accessToken) return null;
      localStorage.setItem('accessToken', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      return data.data.accessToken as string;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// Response interceptor — handle 401 errors (expired token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const accessToken = await refreshAccessToken(refreshToken);

          if (accessToken) {
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Refresh failed — clear auth and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        // No refresh token — clear auth and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

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
