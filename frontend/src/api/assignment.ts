import { apiClient } from './client';

export interface TeacherAssignmentRequest {
  classSubjectId: number;
  teacherUserId: number;
}

// Shape matches backend com.edgepoint.academic.dto.TeacherAssignmentResponseDTO exactly
// (see ClassController#getTeacherAssignmentsByClass) — used when listing the assignments
// for a given class (e.g. on ClassDetailPage).
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

// Shape matches backend com.edgepoint.teacher.dto.TeacherAssignmentDTO exactly (see
// AttendanceController#getMyAssignments) — the logged-in teacher's own assignment list,
// a narrower shape than TeacherAssignmentResponse (no teacherUserId/isActive/createdAt).
export interface MyAssignment {
  assignmentId: number;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function assignTeacher(payload: TeacherAssignmentRequest): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/classes/teacher-assignments', payload);
  return data;
}

export async function getTeacherAssignments(): Promise<ApiResponse<MyAssignment[]>> {
  const { data } = await apiClient.get<ApiResponse<MyAssignment[]>>('/attendance/my-assignments');
  return data;
}

export async function getAssignmentsByClass(classId: number): Promise<ApiResponse<TeacherAssignmentResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<TeacherAssignmentResponse[]>>(`/classes/${classId}/teacher-assignments`);
  return data;
}
