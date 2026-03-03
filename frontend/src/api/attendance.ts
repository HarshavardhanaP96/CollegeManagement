import { apiClient } from './client';

export interface AttendanceRecord {
  studentUserId: number;
  isPresent: boolean;
  remarks?: string;
}

export interface AttendanceCreateRequest {
  assignmentId: number;
  recordDate: string;
  attendanceRecords: AttendanceRecord[];
}

export interface AttendanceUpdateRequest {
  isPresent: boolean;
  remarks?: string;
}

export interface AttendanceResponse {
  attendanceId: number;
  assignmentId: number;
  studentUserId: number;
  studentName: string;
  rollNumber: string;
  recordDate: string;
  isPresent: boolean;
  remarks?: string;
  createdAt: string;
}

export interface AttendanceSummary {
  assignmentId: number;
  recordDate: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Teacher attendance endpoints (now at /attendance/*)
export async function markAttendance(payload: AttendanceCreateRequest): Promise<ApiResponse<AttendanceSummary>> {
  const { data } = await apiClient.post<ApiResponse<AttendanceSummary>>('/attendance', payload);
  return data;
}

export async function getAttendanceByAssignment(
  assignmentId: number,
  params?: { startDate?: string; endDate?: string; studentUserId?: number }
): Promise<ApiResponse<AttendanceResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<AttendanceResponse[]>>(`/attendance/assignment/${assignmentId}`, {
    params,
  });
  return data;
}

export async function updateAttendance(
  attendanceId: number,
  payload: AttendanceUpdateRequest,
): Promise<ApiResponse<AttendanceResponse>> {
  const { data } = await apiClient.put<ApiResponse<AttendanceResponse>>(`/attendance/${attendanceId}`, payload);
  return data;
}

// Student attendance endpoints (now at /student-attendance/*)
export async function getMyAttendance(params?: { semester?: number; subjectId?: number }): Promise<ApiResponse<{
  semester: number;
  academicYear: string;
  overallAttendance: {
    totalClasses: number;
    classesAttended: number;
    attendancePercentage: number;
  };
  subjectWiseAttendance: Array<{
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    teacherName: string;
    totalClasses: number;
    classesAttended: number;
    attendancePercentage: number;
    status: string;
  }>;
}>> {
  const { data } = await apiClient.get<ApiResponse<any>>('/student-attendance/my-attendance', { params });
  return data;
}

export async function getAttendanceBySubject(
  subjectId: number,
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<{
  subjectId: number;
  subjectName: string;
  teacherName: string;
  attendanceRecords: Array<{
    recordDate: string;
    isPresent: boolean;
    remarks?: string;
  }>;
  summary: {
    totalClasses: number;
    classesAttended: number;
    attendancePercentage: number;
  };
}>> {
  const { data } = await apiClient.get<ApiResponse<any>>(`/student-attendance/subject/${subjectId}`, { params });
  return data;
}
