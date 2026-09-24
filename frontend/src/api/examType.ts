import { apiClient } from './client';

export interface ExamTypeCreateRequest {
  examTypeName: string;
  maxMarks: number;
}

// Shape matches backend com.edgepoint.academic.dto.ExamTypeDTO exactly.
export interface ExamTypeResponse {
  examTypeId: number;
  examTypeName: string;
  maxMarks: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function getExamTypes(): Promise<ApiResponse<ExamTypeResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<ExamTypeResponse[]>>('/exam-types');
  return data;
}

export async function createExamType(payload: ExamTypeCreateRequest): Promise<ApiResponse<ExamTypeResponse>> {
  const { data } = await apiClient.post<ApiResponse<ExamTypeResponse>>('/exam-types', payload);
  return data;
}
