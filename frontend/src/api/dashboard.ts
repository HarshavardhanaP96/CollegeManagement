import { apiClient } from './client';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface TeacherDashboardData {
  totalAssignments: number;
  totalStudents: number;
  assignments: Array<{
    assignmentId: number;
    classId: number;
    className: string;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    totalStudents: number;
    isActive: boolean;
  }>;
}

export interface StudentDashboardData {
  currentSemester: number;
  academicYear: string;
  overallAttendance: {
    totalClasses: number;
    classesAttended: number;
    attendancePercentage: number;
  };
  recentMarks: Array<{
    subjectName: string;
    examTypeName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
  }>;
}

export async function getTeacherDashboard(): Promise<ApiResponse<TeacherDashboardData>> {
  const { data } = await apiClient.get<ApiResponse<TeacherDashboardData>>('/dashboard/teacher');
  return data;
}

export async function getStudentDashboard(): Promise<ApiResponse<StudentDashboardData>> {
  const { data } = await apiClient.get<ApiResponse<StudentDashboardData>>('/dashboard/student');
  return data;
}
