import { apiClient } from './client';

export interface CollegeListItem {
  collegeId: number;
  collegeName: string;
  collegeCode: string;
  contactEmail: string;
  contactPhone: string;
  totalDepartments?: number;
  totalStudents?: number;
  totalTeachers?: number;
  createdAt: string;
}

export interface PageMeta {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  success: boolean;
  message: string;
  data: {
    content: T[];
    pageable: PageMeta;
  };
  timestamp: string;
}

export interface CollegeCreateRequest {
  collegeName: string;
  collegeCode: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

export type CollegeUpdateRequest = Partial<Omit<CollegeCreateRequest, 'collegeCode'>>;

export interface CollegeResponse {
  success: boolean;
  message: string;
  data: CollegeListItem;
  timestamp: string;
}

// Matches backend com.edgepoint.core.dto.CollegeResponseDTO exactly — flat, no nested
// departments/courses/statistics (those were previously assumed here but never sent).
export interface CollegeDetail extends CollegeListItem {
  address: string;
}

export interface CollegeDetailResponse {
  success: boolean;
  message: string;
  data: CollegeDetail;
  timestamp: string;
}

export async function getColleges(params: {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
}): Promise<PagedResponse<CollegeListItem>> {
  const { data } = await apiClient.get<PagedResponse<CollegeListItem>>('/colleges', {
    params,
  });
  return data;
}

export async function getCollegeById(collegeId: number): Promise<CollegeDetailResponse> {
  const { data } = await apiClient.get<CollegeDetailResponse>(`/colleges/${collegeId}`);
  return data;
}

export async function createCollege(
  payload: CollegeCreateRequest,
): Promise<CollegeResponse> {
  const { data } = await apiClient.post<CollegeResponse>('/colleges', payload);
  return data;
}

export async function updateCollege(
  collegeId: number,
  payload: CollegeUpdateRequest,
): Promise<CollegeResponse> {
  const { data } = await apiClient.put<CollegeResponse>(`/colleges/${collegeId}`, payload);
  return data;
}

export async function deleteCollege(collegeId: number): Promise<{ success: boolean; message: string; data: null; timestamp: string }> {
  const { data } = await apiClient.delete<{ success: boolean; message: string; data: null; timestamp: string }>(`/colleges/${collegeId}`);
  return data;
}
