import { apiClient } from './client';

export interface MarkEntry {
  studentUserId: number;
  marksObtained: number;
  remarks?: string;
}

// Shape matches backend com.edgepoint.academic.dto.MarkCreateRequest exactly — the field is
// `studentMarks`, not `marksEntries`.
export interface MarkCreateRequest {
  assignmentId: number;
  examTypeId: number;
  studentMarks: MarkEntry[];
}

export interface MarkUpdateRequest {
  marksObtained: number;
  remarks?: string;
}

// Shape matches backend com.edgepoint.academic.dto.MarkResponseDTO exactly — no rollNumber
// or percentage field exists there; percentage is derived client-side from marksObtained/maxMarks.
export interface MarkResponse {
  markId: number;
  assignmentId: number;
  studentUserId: number;
  studentName: string;
  examTypeId: number;
  examTypeName: string;
  marksObtained: number;
  maxMarks: number;
  remarks?: string;
  createdAt: string;
}

// Shape matches backend com.edgepoint.academic.dto.MarkSummaryDTO exactly.
export interface MarksSummary {
  assignmentId: number;
  examTypeId: number;
  examTypeName: string;
  maxMarks: number;
  totalStudents: number;
  enteredCount: number;
  averageMarks: number;
  averagePercentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Shape matches backend com.edgepoint.academic.dto.RosterStudentDTO exactly.
export interface RosterStudent {
  studentUserId: number;
  rollNumber: string;
  fullName: string;
}

export async function getRoster(assignmentId: number): Promise<ApiResponse<RosterStudent[]>> {
  const { data } = await apiClient.get<ApiResponse<RosterStudent[]>>(`/marks/assignment/${assignmentId}/roster`);
  return data;
}

// Teacher marks endpoints (now at /marks/*)
export async function enterMarks(payload: MarkCreateRequest): Promise<ApiResponse<MarksSummary>> {
  const { data } = await apiClient.post<ApiResponse<MarksSummary>>('/marks', payload);
  return data;
}

export async function getMarksByAssignment(
  assignmentId: number,
  params?: { examTypeId?: number }
): Promise<ApiResponse<MarkResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<MarkResponse[]>>(`/marks/assignment/${assignmentId}`, {
    params,
  });
  return data;
}

export async function updateMark(
  markId: number,
  payload: MarkUpdateRequest,
): Promise<ApiResponse<MarkResponse>> {
  const { data } = await apiClient.put<ApiResponse<MarkResponse>>(`/marks/${markId}`, payload);
  return data;
}

// Student marks endpoints (/student-marks/*)
// Shape matches backend com.edgepoint.student.dto.StudentMarkDTO / SubjectMarkDTO / ExamMarkDTO
// exactly (see academic.controller.StudentMarkController#getMyMarks) — do not add fields the
// backend doesn't send (e.g. credits, teacherName, examTypeId) without adding them there first.
export interface ExamMarkView {
  examTypeName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
}

export interface SubjectMarkView {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  examMarks: ExamMarkView[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
}

export interface StudentMarkView {
  studentUserId: number;
  studentName: string;
  rollNumber: string;
  semester: number;
  subjectMarks: SubjectMarkView[];
  overallPercentage: number;
  grade: string;
}

export async function getMyMarks(params?: { semester?: number }): Promise<ApiResponse<StudentMarkView>> {
  const { data } = await apiClient.get<ApiResponse<StudentMarkView>>('/student-marks/my-marks', { params });
  return data;
}
