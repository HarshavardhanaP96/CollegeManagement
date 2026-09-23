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

// Student attendance endpoints (/student-attendance/*)
// Shape matches backend com.edgepoint.student.dto.StudentAttendanceDTO / SubjectAttendanceDTO
// exactly (see attendance.controller.StudentAttendanceController#getMyAttendance) — do not add
// fields the backend doesn't send (e.g. teacherName, subjectCode, status) without adding them
// there first.
export interface SubjectAttendanceView {
  subjectId: number;
  subjectName: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface StudentAttendanceView {
  studentUserId: number;
  studentName: string;
  rollNumber: string;
  semester: number;
  subjectAttendances: SubjectAttendanceView[];
  /** Overall attendance percentage across all subjects (not an object — a single number). */
  overallAttendance: number;
}

export async function getMyAttendance(params?: { semester?: number }): Promise<ApiResponse<StudentAttendanceView>> {
  const { data } = await apiClient.get<ApiResponse<StudentAttendanceView>>('/student-attendance/my-attendance', { params });
  return data;
}

export async function getAttendanceBySubject(subjectId: number): Promise<ApiResponse<SubjectAttendanceView>> {
  const { data } = await apiClient.get<ApiResponse<SubjectAttendanceView>>(`/student-attendance/subject/${subjectId}`);
  return data;
}
