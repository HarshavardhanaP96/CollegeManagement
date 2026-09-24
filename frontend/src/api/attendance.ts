import { apiClient } from './client';

export interface AttendanceRecord {
  studentUserId: number;
  isPresent: boolean;
  remarks?: string;
}

// Shape matches backend com.edgepoint.attendance.dto.AttendanceCreateRequest exactly — the
// field is `studentAttendances`, not `attendanceRecords`.
export interface AttendanceCreateRequest {
  assignmentId: number;
  recordDate: string;
  studentAttendances: AttendanceRecord[];
}

export interface AttendanceUpdateRequest {
  isPresent: boolean;
  remarks?: string;
}

// Shape matches backend com.edgepoint.attendance.dto.AttendanceResponseDTO exactly — no
// rollNumber field exists there.
export interface AttendanceResponse {
  attendanceId: number;
  assignmentId: number;
  studentUserId: number;
  studentName: string;
  recordDate: string;
  isPresent: boolean;
  remarks?: string;
  createdAt: string;
}

// Shape matches backend com.edgepoint.attendance.dto.AttendanceSummaryDTO exactly.
export interface AttendanceSummary {
  assignmentId: number;
  recordDate: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  markedCount: number;
  unmarkedCount: number;
  attendancePercentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Shape matches backend com.edgepoint.academic.dto.RosterStudentDTO exactly. Named distinctly
// from marks.ts's identical DTO/endpoint pair so the two don't collide in the `api/index.ts`
// barrel re-export.
export interface AttendanceRosterStudent {
  studentUserId: number;
  rollNumber: string;
  fullName: string;
}

export async function getAttendanceRoster(assignmentId: number): Promise<ApiResponse<AttendanceRosterStudent[]>> {
  const { data } = await apiClient.get<ApiResponse<AttendanceRosterStudent[]>>(`/attendance/assignment/${assignmentId}/roster`);
  return data;
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
