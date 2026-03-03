import { apiClient } from './client';

export interface TeacherAssignmentRequest {
  classSubjectId: number;
  teacherUserId: number;
}

export interface TeacherAssignmentResponse {
  assignmentId: number;
  classSubjectId: number;
  className: string;
  subjectName: string;
  teacherUserId: number;
  teacherName: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function assignTeacher(payload: TeacherAssignmentRequest): Promise<ApiResponse<TeacherAssignmentResponse>> {
  const { data } = await apiClient.post<ApiResponse<TeacherAssignmentResponse>>('/teacher-assignments', payload);
  return data;
}

export async function getTeacherAssignments(): Promise<ApiResponse<TeacherAssignmentResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<TeacherAssignmentResponse[]>>('/attendance/my-assignments');
  return data;
}

export async function getAssignmentsByClass(classId: number): Promise<ApiResponse<TeacherAssignmentResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<TeacherAssignmentResponse[]>>(`/teacher-assignments/class/${classId}`);
  return data;
}
