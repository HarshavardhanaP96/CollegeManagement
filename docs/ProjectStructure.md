# College Management System - Project Structure

**Backend:** Spring Boot 3.x  
**Frontend:** React 18+ with TypeScript  
**State Management:** Redux Toolkit / Zustand  
**UI Framework:** TailwindCSS + Shadcn/ui

---

## Complete Directory Structure

```
college-management-system/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── collegeManagement/
│   │   │   │           ├── CollegeManagementApplication.java
│   │   │   │           ├── config/
│   │   │   │           │   ├── SecurityConfig.java
│   │   │   │           │   ├── JwtConfig.java
│   │   │   │           │   ├── CorsConfig.java
│   │   │   │           │   ├── OpenApiConfig.java
│   │   │   │           │   ├── AuditConfig.java
│   │   │   │           │   └── AsyncConfig.java
│   │   │   │           ├── security/
│   │   │   │           │   ├── JwtAuthenticationFilter.java
│   │   │   │           │   ├── JwtTokenUtil.java
│   │   │   │           │   ├── TenantContext.java
│   │   │   │           │   ├── CustomUserDetails.java
│   │   │   │           │   └── CustomUserDetailsService.java
│   │   │   │           ├── controller/
│   │   │   │           │   ├── auth/
│   │   │   │           │   │   └── AuthController.java
│   │   │   │           │   ├── admin/
│   │   │   │           │   │   ├── CollegeController.java
│   │   │   │           │   │   └── SystemUserController.java
│   │   │   │           │   ├── collegeadmin/
│   │   │   │           │   │   ├── DepartmentController.java
│   │   │   │           │   │   ├── CourseController.java
│   │   │   │           │   │   └── HODController.java
│   │   │   │           │   ├── hod/
│   │   │   │           │   │   ├── SubjectController.java
│   │   │   │           │   │   ├── TeacherController.java
│   │   │   │           │   │   ├── StudentController.java
│   │   │   │           │   │   ├── ClassController.java
│   │   │   │           │   │   ├── EnrollmentController.java
│   │   │   │           │   │   └── AssignmentController.java
│   │   │   │           │   ├── teacher/
│   │   │   │           │   │   ├── AttendanceController.java
│   │   │   │           │   │   ├── MarksController.java
│   │   │   │           │   │   └── TeacherDashboardController.java
│   │   │   │           │   └── student/
│   │   │   │           │       ├── StudentMarksController.java
│   │   │   │           │       ├── StudentAttendanceController.java
│   │   │   │           │       ├── StudentProfileController.java
│   │   │   │           │       └── StudentDashboardController.java
│   │   │   │           ├── service/
│   │   │   │           │   ├── auth/
│   │   │   │           │   │   ├── AuthService.java
│   │   │   │           │   │   └── impl/
│   │   │   │           │   │       └── AuthServiceImpl.java
│   │   │   │           │   ├── college/
│   │   │   │           │   │   ├── CollegeService.java
│   │   │   │           │   │   └── impl/
│   │   │   │           │   │       └── CollegeServiceImpl.java
│   │   │   │           │   ├── department/
│   │   │   │           │   │   ├── DepartmentService.java
│   │   │   │           │   │   └── impl/
│   │   │   │           │   │       └── DepartmentServiceImpl.java
│   │   │   │           │   ├── subject/
│   │   │   │           │   ├── teacher/
│   │   │   │           │   ├── student/
│   │   │   │           │   ├── attendance/
│   │   │   │           │   ├── marks/
│   │   │   │           │   └── report/
│   │   │   │           ├── repository/
│   │   │   │           │   ├── base/
│   │   │   │           │   │   └── SoftDeleteRepository.java
│   │   │   │           │   ├── CollegeRepository.java
│   │   │   │           │   ├── UserRepository.java
│   │   │   │           │   ├── UserRoleRepository.java
│   │   │   │           │   ├── DepartmentRepository.java
│   │   │   │           │   ├── CourseRepository.java
│   │   │   │           │   ├── SubjectRepository.java
│   │   │   │           │   ├── ClassRepository.java
│   │   │   │           │   ├── TeacherProfileRepository.java
│   │   │   │           │   ├── StudentProfileRepository.java
│   │   │   │           │   ├── EnrollmentRepository.java
│   │   │   │           │   ├── TeacherAssignmentRepository.java
│   │   │   │           │   ├── AttendanceRepository.java
│   │   │   │           │   ├── MarksRepository.java
│   │   │   │           │   └── ExamTypeRepository.java
│   │   │   │           ├── entity/
│   │   │   │           │   ├── base/
│   │   │   │           │   │   └── AuditableEntity.java
│   │   │   │           │   ├── College.java
│   │   │   │           │   ├── User.java
│   │   │   │           │   ├── UserRole.java
│   │   │   │           │   ├── Department.java
│   │   │   │           │   ├── Course.java
│   │   │   │           │   ├── Subject.java
│   │   │   │           │   ├── Class.java
│   │   │   │           │   ├── TeacherProfile.java
│   │   │   │           │   ├── StudentProfile.java
│   │   │   │           │   ├── ClassSubject.java
│   │   │   │           │   ├── StudentEnrollment.java
│   │   │   │           │   ├── TeacherAssignment.java
│   │   │   │           │   ├── ExamType.java
│   │   │   │           │   ├── Marks.java
│   │   │   │           │   ├── AttendanceRecord.java
│   │   │   │           │   ├── Notification.java
│   │   │   │           │   └── AuditLog.java
│   │   │   │           ├── dto/
│   │   │   │           │   ├── request/
│   │   │   │           │   │   ├── auth/
│   │   │   │           │   │   │   ├── LoginRequest.java
│   │   │   │           │   │   │   ├── ChangePasswordRequest.java
│   │   │   │           │   │   │   └── RefreshTokenRequest.java
│   │   │   │           │   │   ├── college/
│   │   │   │           │   │   │   ├── CollegeCreateRequest.java
│   │   │   │           │   │   │   └── CollegeUpdateRequest.java
│   │   │   │           │   │   ├── department/
│   │   │   │           │   │   ├── subject/
│   │   │   │           │   │   ├── teacher/
│   │   │   │           │   │   ├── student/
│   │   │   │           │   │   ├── attendance/
│   │   │   │           │   │   │   ├── AttendanceCreateRequest.java
│   │   │   │           │   │   │   └── AttendanceUpdateRequest.java
│   │   │   │           │   │   └── marks/
│   │   │   │           │   │       ├── MarkCreateRequest.java
│   │   │   │           │   │       └── MarkUpdateRequest.java
│   │   │   │           │   └── response/
│   │   │   │           │       ├── ApiResponse.java
│   │   │   │           │       ├── PagedResponse.java
│   │   │   │           │       ├── auth/
│   │   │   │           │       │   ├── LoginResponse.java
│   │   │   │           │       │   └── UserResponse.java
│   │   │   │           │       ├── college/
│   │   │   │           │       ├── department/
│   │   │   │           │       ├── subject/
│   │   │   │           │       ├── attendance/
│   │   │   │           │       │   ├── AttendanceResponse.java
│   │   │   │           │       │   └── AttendanceSummaryResponse.java
│   │   │   │           │       └── marks/
│   │   │   │           │           ├── MarkResponse.java
│   │   │   │           │           └── MarksSummaryResponse.java
│   │   │   │           ├── mapper/
│   │   │   │           │   ├── CollegeMapper.java
│   │   │   │           │   ├── UserMapper.java
│   │   │   │           │   ├── DepartmentMapper.java
│   │   │   │           │   ├── SubjectMapper.java
│   │   │   │           │   ├── AttendanceMapper.java
│   │   │   │           │   └── MarksMapper.java
│   │   │   │           ├── exception/
│   │   │   │           │   ├── GlobalExceptionHandler.java
│   │   │   │           │   ├── ResourceNotFoundException.java
│   │   │   │           │   ├── DuplicateResourceException.java
│   │   │   │           │   ├── UnauthorizedException.java
│   │   │   │           │   ├── BusinessRuleViolationException.java
│   │   │   │           │   └── ValidationException.java
│   │   │   │           ├── validation/
│   │   │   │           │   ├── validator/
│   │   │   │           │   │   ├── EmailValidator.java
│   │   │   │           │   │   ├── PhoneValidator.java
│   │   │   │           │   │   └── MarksValidator.java
│   │   │   │           │   └── annotation/
│   │   │   │           │       ├── ValidEmail.java
│   │   │   │           │       ├── ValidPhone.java
│   │   │   │           │       └── ValidMarks.java
│   │   │   │           └── util/
│   │   │   │               ├── DateUtil.java
│   │   │   │               ├── PasswordUtil.java
│   │   │   │               ├── EmailUtil.java
│   │   │   │               └── PDFUtil.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       ├── db/
│   │   │       │   └── changelog/
│   │   │       │       ├── db.changelog-master.xml
│   │   │       │       └── v1.0/
│   │   │       │           ├── 001-create-user-roles-table.xml
│   │   │       │           ├── 002-create-colleges-table.xml
│   │   │       │           └── ... (all migration files)
│   │   │       └── static/
│   │   │           ├── email-templates/
│   │   │           └── report-templates/
│   │   └── test/
│   │       └── java/
│   │           └── com/
│   │               └── collegeManagement/
│   │                   ├── service/
│   │                   ├── controller/
│   │                   └── integration/
│   ├── pom.xml
│   ├── settings.maven
│   └── README.md
│
└── frontend/
    ├── public/
    │   ├── index.html
    │   ├── favicon.ico
    │   └── assets/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   ├── vite-env.d.ts
    │   ├── api/
    │   │   ├── client.ts
    │   │   ├── endpoints.ts
    │   │   ├── auth.ts
    │   │   ├── college.ts
    │   │   ├── department.ts
    │   │   ├── attendance.ts
    │   │   ├── marks.ts
    │   │   └── interceptors.ts
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── Select.tsx
    │   │   │   ├── Table.tsx
    │   │   │   ├── Modal.tsx
    │   │   │   ├── Card.tsx
    │   │   │   ├── Loading.tsx
    │   │   │   ├── ErrorBoundary.tsx
    │   │   │   └── ProtectedRoute.tsx
    │   │   ├── layout/
    │   │   │   ├── MainLayout.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── Header.tsx
    │   │   │   ├── Footer.tsx
    │   │   │   └── Breadcrumb.tsx
    │   │   ├── auth/
    │   │   │   ├── LoginForm.tsx
    │   │   │   ├── ChangePasswordForm.tsx
    │   │   │   └── ForgotPasswordForm.tsx
    │   │   ├── superadmin/
    │   │   │   ├── CollegeList.tsx
    │   │   │   ├── CollegeForm.tsx
    │   │   │   └── CollegeDetails.tsx
    │   │   ├── collegeadmin/
    │   │   │   ├── DepartmentList.tsx
    │   │   │   ├── DepartmentForm.tsx
    │   │   │   ├── CourseList.tsx
    │   │   │   ├── CourseForm.tsx
    │   │   │   └── HODAssignment.tsx
    │   │   ├── hod/
    │   │   │   ├── SubjectList.tsx
    │   │   │   ├── SubjectForm.tsx
    │   │   │   ├── TeacherList.tsx
    │   │   │   ├── TeacherForm.tsx
    │   │   │   ├── ClassList.tsx
    │   │   │   ├── ClassForm.tsx
    │   │   │   ├── EnrollmentManager.tsx
    │   │   │   └── TeacherAssignment.tsx
    │   │   ├── teacher/
    │   │   │   ├── AttendanceMarker.tsx
    │   │   │   ├── AttendanceHistory.tsx
    │   │   │   ├── MarksEntry.tsx
    │   │   │   ├── MarksView.tsx
    │   │   │   └── TeacherDashboard.tsx
    │   │   ├── student/
    │   │   │   ├── StudentDashboard.tsx
    │   │   │   ├── MarksView.tsx
    │   │   │   ├── AttendanceView.tsx
    │   │   │   ├── ProfileView.tsx
    │   │   │   └── ProfileEdit.tsx
    │   │   └── dashboard/
    │   │       ├── SuperAdminDashboard.tsx
    │   │       ├── CollegeAdminDashboard.tsx
    │   │       ├── HODDashboard.tsx
    │   │       ├── TeacherDashboard.tsx
    │   │       └── StudentDashboard.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── NotFound.tsx
    │   │   ├── Unauthorized.tsx
    │   │   └── ServerError.tsx
    │   ├── store/
    │   │   ├── index.ts
    │   │   ├── slices/
    │   │   │   ├── authSlice.ts
    │   │   │   ├── collegeSlice.ts
    │   │   │   ├── departmentSlice.ts
    │   │   │   ├── attendanceSlice.ts
    │   │   │   └── marksSlice.ts
    │   │   └── hooks.ts
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── usePermissions.ts
    │   │   ├── useDebounce.ts
    │   │   ├── usePagination.ts
    │   │   └── useModal.ts
    │   ├── utils/
    │   │   ├── constants.ts
    │   │   ├── helpers.ts
    │   │   ├── validators.ts
    │   │   ├── formatters.ts
    │   │   └── storage.ts
    │   ├── types/
    │   │   ├── auth.types.ts
    │   │   ├── college.types.ts
    │   │   ├── department.types.ts
    │   │   ├── user.types.ts
    │   │   ├── attendance.types.ts
    │   │   └── marks.types.ts
    │   ├── routes/
    │   │   ├── index.tsx
    │   │   ├── SuperAdminRoutes.tsx
    │   │   ├── CollegeAdminRoutes.tsx
    │   │   ├── HODRoutes.tsx
    │   │   ├── TeacherRoutes.tsx
    │   │   └── StudentRoutes.tsx
    │   └── styles/
    │       ├── globals.css
    │       └── tailwind.css
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── README.md
```

---

## Frontend Component Examples

### Attendance Marker Component

```tsx
// src/components/teacher/AttendanceMarker.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { attendanceApi } from '@/api/attendance';
import { Button, Card, Table, Checkbox } from '@/components/common';
import { toast } from 'react-hot-toast';

interface Student {
  studentUserId: number;
  rollNumber: string;
  fullName: string;
  isPresent: boolean;
  remarks: string;
}

export const AttendanceMarker: React.FC = () => {
  const { assignmentId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStudents();
  }, [assignmentId]);

  const fetchStudents = async () => {
    try {
      const response = await attendanceApi.getStudentsByAssignment(Number(assignmentId));
      setStudents(response.data.students.map(s => ({ ...s, isPresent: true, remarks: '' })));
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setStudents(prev =>
      prev.map(s => s.studentUserId === studentId ? { ...s, isPresent } : s)
    );
  };

  const handleSubmit = async () => {
    try {
      const attendanceRecords = students.map(s => ({
        studentUserId: s.studentUserId,
        isPresent: s.isPresent,
        remarks: s.remarks
      }));

      await attendanceApi.markAttendance({
        assignmentId: Number(assignmentId),
        recordDate: selectedDate,
        attendanceRecords
      });

      toast.success('Attendance marked successfully');
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mark Attendance</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <Table>
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Name</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.studentUserId}>
              <td>{student.rollNumber}</td>
              <td>{student.fullName}</td>
              <td>
                <Checkbox
                  checked={student.isPresent}
                  onChange={() => handleAttendanceChange(student.studentUserId, true)}
                />
              </td>
              <td>
                <Checkbox
                  checked={!student.isPresent}
                  onChange={() => handleAttendanceChange(student.studentUserId, false)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={student.remarks}
                  onChange={(e) => {
                    setStudents(prev =>
                      prev.map(s =>
                        s.studentUserId === student.studentUserId
                          ? { ...s, remarks: e.target.value }
                          : s
                      )
                    );
                  }}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Optional remarks"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          Submit Attendance
        </Button>
      </div>
    </Card>
  );
};
```

### Student Marks View Component

```tsx
// src/components/student/MarkView.tsx

import React, { useEffect, useState } from 'react';
import { markApi } from '@/api/mark';
import { Card, Table, Select } from '@/components/common';
import { toast } from 'react-hot-toast';

interface SubjectMarks {
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  examMarks: Array<{
    examTypeName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
  }>;
  overallPercentage: number;
  grade: string;
}

export const MarkView: React.FC = () => {
  const [marks, setMarks] = useState<SubjectMarks[]>([]);
  const [semester, setSemester] = useState('3');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, [semester]);

  const fetchMarks = async () => {
    try {
      const response = await marksApi.getMyMarks({ semester });
      setMarks(response.data.subjects);
    } catch (error) {
      toast.error('Failed to load marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Marks</h1>
        <Select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          options={[
            { value: '1', label: 'Semester 1' },
            { value: '2', label: 'Semester 2' },
            { value: '3', label: 'Semester 3' },
          ]}
        />
      </div>

      {marks.map(subject => (
        <Card key={subject.subjectCode} className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{subject.subjectName}</h2>
            <p className="text-sm text-gray-600">
              Code: {subject.subjectCode} | Teacher: {subject.teacherName}
            </p>
          </div>

          <Table>
            <thead>
              <tr>
                <th>Exam Type</th>
                <th>Marks Obtained</th>
                <th>Maximum Marks</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {subject.examMarks.map(exam => (
                <tr key={exam.examTypeName}>
                  <td>{exam.examTypeName}</td>
                  <td>{exam.marksObtained}</td>
                  <td>{exam.maxMarks}</td>
                  <td>{exam.percentage.toFixed(2)}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td>Overall</td>
                <td colSpan={2}>Grade: {subject.grade}</td>
                <td>{subject.overallPercentage.toFixed(2)}%</td>
              </tr>
            </tbody>
          </Table>
        </Card>
      ))}
    </div>
  );
};
```

---

## Environment Variables

### Backend (.env or application-prod.yml)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=college_mgmt_db
DB_USERNAME=cms_user
DB_PASSWORD=secure_password

JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRATION=86400000

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

ZIPKIN_URL=http://localhost:9411
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_APP_NAME=College Management System
VITE_ENABLE_SWAGGER=false
```

---

**End of Project Structure Document**