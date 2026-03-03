import { apiClient } from './client';
import type { ApiResponse } from './index';

export interface TeacherCreateRequest {
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  password?: string;
  employeeId: string;
  qualification?: string;
  specialization?: string;
  hireDate: string;
  deptId?: number;
}

export interface TeacherUpdateRequest {
  email?: string;
  fullName?: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
}

export interface TeacherResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  employeeId: string;
  deptId: number;
  deptName: string;
  hireDate: string;
  qualification: string;
  specialization: string;
  isActive: boolean;
  createdAt: string;
}

export async function getTeachers(): Promise<ApiResponse<TeacherResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<TeacherResponse[]>>('/teachers');
  return data;
}

export async function getTeacherById(teacherId: number): Promise<ApiResponse<TeacherResponse>> {
  const { data } = await apiClient.get<ApiResponse<TeacherResponse>>(`/teachers/${teacherId}`);
  return data;
}

export async function createTeacher(payload: TeacherCreateRequest): Promise<ApiResponse<TeacherResponse>> {
  const { data } = await apiClient.post<ApiResponse<TeacherResponse>>('/teachers', payload);
  return data;
}

export async function updateTeacher(
  teacherId: number,
  payload: TeacherUpdateRequest,
): Promise<ApiResponse<TeacherResponse>> {
  const { data } = await apiClient.put<ApiResponse<TeacherResponse>>(`/teachers/${teacherId}`, payload);
  return data;
}

export async function deleteTeacher(teacherId: number): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/teachers/${teacherId}`);
  return data;
}
