import { apiClient } from './client';

export interface DepartmentCreateRequest {
  deptName: string;
  deptCode: string;
}

export interface DepartmentUpdateRequest {
  deptName?: string;
  deptCode?: string;
}

export interface DepartmentResponse {
  deptId: number;
  collegeId: number;
  deptName: string;
  deptCode: string;
  deptHeadUserId?: number;
  deptHeadName?: string;
  totalTeachers?: number;
  totalStudents?: number;
  totalSubjects?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AssignHODRequest {
  createNew: boolean;
  userId?: number;
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  password?: string;
}

export async function getDepartments(): Promise<ApiResponse<DepartmentResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<DepartmentResponse[]>>('/departments');
  return data;
}

export async function getDepartmentById(deptId: number): Promise<ApiResponse<DepartmentResponse>> {
  const { data } = await apiClient.get<ApiResponse<DepartmentResponse>>(`/departments/${deptId}`);
  return data;
}

export async function createDepartment(payload: DepartmentCreateRequest): Promise<ApiResponse<DepartmentResponse>> {
  const { data } = await apiClient.post<ApiResponse<DepartmentResponse>>('/departments', payload);
  return data;
}

export async function updateDepartment(
  deptId: number,
  payload: DepartmentUpdateRequest,
): Promise<ApiResponse<DepartmentResponse>> {
  const { data } = await apiClient.put<ApiResponse<DepartmentResponse>>(`/departments/${deptId}`, payload);
  return data;
}

export async function assignHOD(deptId: number, payload: AssignHODRequest): Promise<ApiResponse<DepartmentResponse>> {
  const { data } = await apiClient.put<ApiResponse<DepartmentResponse>>(`/departments/${deptId}/assign-hod`, payload);
  return data;
}
