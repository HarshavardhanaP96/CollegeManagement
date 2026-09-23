import { apiClient } from './client';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Shapes below match backend com.edgepoint.teacher.dto.TeacherDashboardDTO and
// com.edgepoint.student.dto.StudentDashBoardDTO exactly (see teacher.controller.
// TeacherDashboardController / student.controller.StudentDashboardController) — do not add
// fields the backend doesn't send without adding them there first.
export interface TeacherDashboardData {
  teacherName: string;
  department: string;
  totalAssignments: number;
  totalClasses: number;
  totalStudents: number;
  activeAssignments: Array<{
    assignmentId: number;
    classId: number;
    className: string;
    subjectId: number;
    subjectName: string;
  }>;
  recentActivities: Array<{
    activityType: string;
    description: string;
    timestamp: string;
  }>;
}

export interface StudentDashboardData {
  studentName: string;
  rollNumber: string;
  department: string;
  course: string;
  currentSemester: number;
  /** Overall attendance percentage (not an object — a single number). */
  overallAttendance: number;
  overallPercentage: number;
  totalSubjects: number;
  recentAttendance: {
    subjectAttendances: Array<{
      subjectId: number;
      subjectName: string;
      totalClasses: number;
      presentCount: number;
      absentCount: number;
      attendancePercentage: number;
    }>;
  };
  recentMarks: {
    subjectMarks: Array<{
      subjectId: number;
      subjectName: string;
      subjectCode: string;
      totalMarks: number;
      totalMaxMarks: number;
      percentage: number;
    }>;
  };
}

export async function getTeacherDashboard(): Promise<ApiResponse<TeacherDashboardData>> {
  const { data } = await apiClient.get<ApiResponse<TeacherDashboardData>>('/dashboard/teacher');
  return data;
}

export async function getStudentDashboard(): Promise<ApiResponse<StudentDashboardData>> {
  const { data } = await apiClient.get<ApiResponse<StudentDashboardData>>('/dashboard/student');
  return data;
}
