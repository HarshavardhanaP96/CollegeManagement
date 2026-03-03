import { apiClient } from './client';

export interface EnrollmentRequest {
  studentUserId: number;
  classId: number;
}

export interface EnrollmentResponse {
  enrollmentId: number;
  studentUserId: number;
  studentName: string;
  rollNumber: string;
  classId: number;
  className: string;
  enrollmentStatus: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function enrollStudent(payload: EnrollmentRequest): Promise<ApiResponse<EnrollmentResponse>> {
  const { data } = await apiClient.post<ApiResponse<EnrollmentResponse>>('/enrollments', payload);
  return data;
}

export async function getEnrollmentsByClass(classId: number): Promise<ApiResponse<EnrollmentResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<EnrollmentResponse[]>>(`/enrollments/class/${classId}`);
  return data;
}
