import { apiClient } from './client';

export interface SubjectCreateRequest {
  subjectCode: string;
  subjectName: string;
  credits: number;
  subjectType: string;
}

export interface SubjectUpdateRequest {
  subjectName?: string;
  subjectCode?: string;
  credits?: number;
  subjectType?: string;
}

export interface SubjectResponse {
  subjectId: number;
  deptId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  subjectType: string;
  totalClasses?: number;
  totalTeachersAssigned?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function getSubjects(): Promise<ApiResponse<SubjectResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<SubjectResponse[]>>('/subjects');
  return data;
}

export async function getSubjectById(subjectId: number): Promise<ApiResponse<SubjectResponse>> {
  const { data } = await apiClient.get<ApiResponse<SubjectResponse>>(`/subjects/${subjectId}`);
  return data;
}

export async function createSubject(payload: SubjectCreateRequest): Promise<ApiResponse<SubjectResponse>> {
  const { data } = await apiClient.post<ApiResponse<SubjectResponse>>('/subjects', payload);
  return data;
}

export async function updateSubject(
  subjectId: number,
  payload: SubjectUpdateRequest,
): Promise<ApiResponse<SubjectResponse>> {
  const { data } = await apiClient.put<ApiResponse<SubjectResponse>>(`/subjects/${subjectId}`, payload);
  return data;
}

export async function deleteSubject(subjectId: number): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/subjects/${subjectId}`);
  return data;
}
