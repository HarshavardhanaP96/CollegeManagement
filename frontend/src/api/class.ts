import { apiClient } from './client';

export interface ClassCreateRequest {
  courseId: number;
  academicYear: string;
  semester: number;
  section: string;
  className?: string;
}

// Shape matches backend com.edgepoint.academic.dto.ClassResponseDTO exactly — no courseName,
// totalStudents or totalSubjects field exists there (courseName in particular was previously
// assumed here but never sent, always undefined at runtime).
export interface ClassResponse {
  classId: number;
  deptId: number;
  courseId: number;
  academicYear: string;
  semester: number;
  section: string;
  className: string;
  createdAt: string;
}

export interface AddSubjectToClassRequest {
  subjectId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function getClasses(): Promise<ApiResponse<ClassResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<ClassResponse[]>>('/classes');
  return data;
}

export async function getClassById(classId: number): Promise<ApiResponse<ClassResponse>> {
  const { data } = await apiClient.get<ApiResponse<ClassResponse>>(`/classes/${classId}`);
  return data;
}

export async function createClass(payload: ClassCreateRequest): Promise<ApiResponse<ClassResponse>> {
  const { data } = await apiClient.post<ApiResponse<ClassResponse>>('/classes', payload);
  return data;
}

export async function addSubjectToClass(
  classId: number,
  payload: AddSubjectToClassRequest,
): Promise<ApiResponse<ClassResponse>> {
  const { data } = await apiClient.post<ApiResponse<ClassResponse>>(`/classes/${classId}/subjects`, payload);
  return data;
}
