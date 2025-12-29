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

export async function getColleges(params: {
  page?: number;
  size?: number;
  search?: string;
}): Promise<PagedResponse<CollegeListItem>> {
  const { data } = await apiClient.get<PagedResponse<CollegeListItem>>('/admin/colleges', {
    params,
  });
  return data;
}

export async function createCollege(
  payload: CollegeCreateRequest,
): Promise<CollegeResponse> {
  const { data } = await apiClient.post<CollegeResponse>('/admin/colleges', payload);
  return data;
}



