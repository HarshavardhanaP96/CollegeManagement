import { apiClient } from './client';

export interface CourseCreateRequest {
  courseName: string;
  courseCode: string;
  durationYears: number;
  totalSemesters: number;
}

export interface CourseUpdateRequest {
  courseName?: string;
  courseCode?: string;
  durationYears?: number;
  totalSemesters?: number;
}

export interface CourseResponse {
  courseId: number;
  collegeId: number;
  courseName: string;
  courseCode: string;
  durationYears: number;
  totalSemesters: number;
  totalStudents?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export async function getCourses(): Promise<ApiResponse<CourseResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<CourseResponse[]>>('/courses');
  return data;
}

export async function getCourseById(courseId: number): Promise<ApiResponse<CourseResponse>> {
  const { data } = await apiClient.get<ApiResponse<CourseResponse>>(`/courses/${courseId}`);
  return data;
}

export async function createCourse(payload: CourseCreateRequest): Promise<ApiResponse<CourseResponse>> {
  const { data } = await apiClient.post<ApiResponse<CourseResponse>>('/courses', payload);
  return data;
}

export async function updateCourse(
  courseId: number,
  payload: CourseUpdateRequest,
): Promise<ApiResponse<CourseResponse>> {
  const { data } = await apiClient.put<ApiResponse<CourseResponse>>(`/courses/${courseId}`, payload);
  return data;
}

export async function deleteCourse(courseId: number): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/courses/${courseId}`);
  return data;
}
