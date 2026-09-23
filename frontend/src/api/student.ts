import { apiClient } from './client';
import type { ApiResponse } from './index';

export interface StudentProfileUpdateRequest {
  phone?: string;
  email?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
}

// Shape matches backend com.edgepoint.student.dto.StudentProfileDTO exactly (see
// student.controller.StudentProfileController#getMyProfile) — it's flat, with no nested
// `studentProfile` object and no collegeId/collegeName. Do not add fields the backend
// doesn't send without adding them there first.
export interface StudentProfileMinimal {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  rollNumber: string;
  deptId: number;
  deptName: string;
  courseId: number;
  courseName: string;
  admissionYear: number;
  currentSemester: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dateOfBirth: string;
  address: string;
}

// Administrative Student DTO
export interface StudentResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  rollNumber: string;
  deptId: number;
  deptName: string;
  courseId: number;
  courseName: string;
  admissionYear: number;
  currentSemester: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dateOfBirth: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface StudentCreateRequest {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  rollNumber: string;
  deptId: number;
  courseId: number;
  admissionYear: number;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  dateOfBirth?: string;
  address?: string;
}

// User-Facing Profile API
export async function getMyProfile(): Promise<ApiResponse<StudentProfileMinimal>> {
  const { data } = await apiClient.get<ApiResponse<StudentProfileMinimal>>('/profile');
  return data;
}

export async function updateMyProfile(payload: StudentProfileUpdateRequest): Promise<ApiResponse<StudentProfileMinimal>> {
  const { data } = await apiClient.put<ApiResponse<StudentProfileMinimal>>('/profile', payload);
  return data;
}

// Administrative Management API
export async function getStudents(): Promise<ApiResponse<StudentResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<StudentResponse[]>>('/students');
  return data;
}

export async function getStudentById(studentId: number): Promise<ApiResponse<StudentResponse>> {
  const { data } = await apiClient.get<ApiResponse<StudentResponse>>(`/students/${studentId}`);
  return data;
}

export async function createStudent(payload: StudentCreateRequest): Promise<ApiResponse<StudentResponse>> {
  const { data } = await apiClient.post<ApiResponse<StudentResponse>>('/students', payload);
  return data;
}

export async function updateStudent(id: number, payload: Partial<StudentCreateRequest>): Promise<ApiResponse<StudentResponse>> {
  const { data } = await apiClient.put<ApiResponse<StudentResponse>>(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id: number): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/students/${id}`);
  return data;
}
