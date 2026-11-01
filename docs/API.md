# College Management System - API Documentation

**Version:** 2.0  
**Base URL:** `https://college.example.com/api/v1`  
**Authentication:** JWT Bearer Token

---

## Table of Contents
1. [Authentication APIs](#1-authentication-apis)
2. [College APIs](#2-college-apis)
3. [Department APIs](#3-department-apis)
4. [Course APIs](#4-course-apis)
5. [Subject APIs](#5-subject-apis)
6. [Class APIs](#6-class-apis)
7. [Teacher Management APIs](#7-teacher-management-apis)
8. [Teacher Assignment APIs](#8-teacher-assignment-apis)
9. [Enrollment APIs](#9-enrollment-apis)
10. [Attendance APIs (Teacher)](#10-attendance-apis-teacher)
11. [Attendance APIs (Student)](#11-attendance-apis-student)
12. [Marks APIs (Teacher)](#12-marks-apis-teacher)
13. [Marks APIs (Student)](#13-marks-apis-student)
14. [Profile APIs](#14-profile-apis)
15. [Dashboard APIs](#15-dashboard-apis)
16. [Student Management APIs](#19-student-management-apis)
17. [Common Response Codes](#17-common-response-codes)
18. [Error Handling](#18-error-handling)
23. [Support API](#23-support-api)
24. [Observability Endpoints](#24-observability-endpoints)
25. [Audit Log API](#25-audit-log-api)
26. [Privacy APIs](#26-privacy-apis)
27. [Knowledge Base APIs](#27-knowledge-base-apis)

---

## API Design Principles

1. **Resource-based URLs** — Endpoints are named by resource, NOT by role. Roles are enforced server-side via JWT claims.
2. **Role hierarchy** — `SUPERADMIN > COLLEGEADMIN > HOD > TEACHER | STUDENT`. Higher roles inherit access to lower role endpoints.
3. **Data scoping** — Each user sees only data within their college/department, enforced by `TenantContext` extracted from the JWT token.
4. **JWT-secured** — All endpoints except `/auth/login` and `/auth/refresh-token` require a valid Bearer token.

---

## 1. Authentication APIs

### 1.1 Login
**Endpoint:** `POST /auth/login`  
**Access:** Public  
**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 123,
      "username": "john.doe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "roleId": 4,
      "roleName": "TEACHER",
      "collegeId": 5,
      "collegeName": "ABC Institute of Technology",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00"
    }
  },
  "timestamp": "2024-12-12T10:30:00"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username or password",
  "data": null,
  "timestamp": "2024-12-12T10:30:00"
}
```

**JWT Token Claims:**
The access token payload contains:
```json
{
  "sub": "john.doe",
  "userId": 123,
  "collegeId": 5,
  "roleId": 4,
  "roleName": "TEACHER",
  "iat": 1702375800,
  "exp": 1702462200
}
```

### 1.2 Refresh Token
**Endpoint:** `POST /auth/refresh-token`  
**Access:** Public  
**Description:** Exchange a refresh token for a new access token and a new refresh token.
Refresh tokens are stored server-side (`refresh_tokens`, V8) by hashed `jti`. Each refresh
**rotates**: the presented token is revoked and a new pair is returned. Presenting a token that
was already rotated is treated as theft and revokes **all** of that user's refresh tokens.
Invalid, expired or revoked tokens get `401`.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  },
  "timestamp": "2024-12-12T10:35:00"
}
```

### 1.3 Logout
**Endpoint:** `POST /auth/logout`  
**Access:** Authenticated  
**Headers:** `Authorization: Bearer {token}`

**Request Body (optional):** `{ "refreshToken": "..." }` — when sent, that refresh token is
revoked. The access token itself stays valid until it expires (there is no access-token
blacklist).

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null,
  "timestamp": "2024-12-12T10:40:00"
}
```

### 1.4 Change Password
**Endpoint:** `POST /auth/change-password`  
**Access:** Authenticated  
**Headers:** `Authorization: Bearer {token}`

Revokes all of the user's refresh tokens, so every other session has to log in again.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login with new password.",
  "data": null,
  "timestamp": "2024-12-12T10:45:00"
}
```

### 1.5 Validate Token
**Endpoint:** `GET /auth/validate-token`  
**Access:** Authenticated  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": true,
  "timestamp": "2024-12-12T10:46:00"
}
```

---

## 2. College APIs

### 2.1 Create College
**Endpoint:** `POST /colleges`  
**Access:** SUPERADMIN  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "collegeName": "ABC Institute of Technology",
  "collegeCode": "ABC-IT",
  "address": "123 Main Street, City, State - 12345",
  "contactEmail": "admin@abc-it.edu",
  "contactPhone": "+1-234-567-8900"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "College created successfully",
  "data": {
    "collegeId": 1,
    "collegeName": "ABC Institute of Technology",
    "collegeCode": "ABC-IT",
    "address": "123 Main Street, City, State - 12345",
    "contactEmail": "admin@abc-it.edu",
    "contactPhone": "+1-234-567-8900",
    "isDeleted": false,
    "createdAt": "2024-12-12T10:50:00",
    "createdBy": 1
  },
  "timestamp": "2024-12-12T10:50:00"
}
```

### 2.2 Get All Colleges
**Endpoint:** `GET /colleges`  
**Access:** SUPERADMIN  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (optional, default: 0)
- `size` (optional, default: 20)
- `sort` (optional, default: "collegeName,asc")
- `search` (optional) - Search by name or code

**Example:** `GET /colleges?page=0&size=10&search=ABC`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Colleges retrieved successfully",
  "data": {
    "content": [
      {
        "collegeId": 1,
        "collegeName": "ABC Institute of Technology",
        "collegeCode": "ABC-IT",
        "contactEmail": "admin@abc-it.edu",
        "contactPhone": "+1-234-567-8900",
        "totalDepartments": 5,
        "totalStudents": 1250,
        "totalTeachers": 85,
        "isDeleted": false,
        "createdAt": "2024-12-12T10:50:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2024-12-12T11:00:00"
}
```

### 2.3 Get College by ID
**Endpoint:** `GET /colleges/{collegeId}`  
**Access:** SUPERADMIN  
**Headers:** `Authorization: Bearer {token}`

### 2.4 Update College
**Endpoint:** `PUT /colleges/{collegeId}`  
**Access:** SUPERADMIN  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "collegeName": "ABC Institute of Technology and Management",
  "address": "456 New Address, City, State - 12345",
  "contactEmail": "newadmin@abc-it.edu",
  "contactPhone": "+1-234-567-8901"
}
```

### 2.5 Delete College (Soft Delete)
**Endpoint:** `DELETE /colleges/{collegeId}`  
**Access:** SUPERADMIN  
**Headers:** `Authorization: Bearer {token}`

### 2.6 Get College Statistics
**Endpoint:** `GET /colleges/{collegeId}/statistics`  
**Access:** SUPERADMIN  
**Headers:** `Authorization: Bearer {token}`

---

## 3. Department APIs

### 3.1 Create Department
**Endpoint:** `POST /departments`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "deptName": "Computer Science and Engineering",
  "deptCode": "CSE"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "deptId": 1,
    "collegeId": 1,
    "deptName": "Computer Science and Engineering",
    "deptCode": "CSE",
    "deptHeadUserId": null,
    "deptHeadName": null,
    "createdAt": "2024-12-12T11:20:00",
    "createdBy": 2
  },
  "timestamp": "2024-12-12T11:20:00"
}
```

### 3.2 Get All Departments
**Endpoint:** `GET /departments`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

### 3.3 Get Department by ID
**Endpoint:** `GET /departments/{deptId}`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

### 3.4 Update Department
**Endpoint:** `PUT /departments/{deptId}`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

### 3.5 Assign HOD to Department
**Endpoint:** `POST /departments/{deptId}/assign-hod`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

**Request Body (Create New HOD):**
```json
{
  "createNew": true,
  "username": "dr.smith",
  "email": "jane.smith@abc-it.edu",
  "fullName": "Dr. Jane Smith",
  "phone": "+1-234-567-8910",
  "password": "TempPassword123!"
}
```

**Request Body (Assign Existing User):**
```json
{
  "createNew": false,
  "userId": 10
}
```

### 3.6 Delete Department
**Endpoint:** `DELETE /departments/{deptId}`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

---

## 4. Course APIs

### 4.1 Create Course
**Endpoint:** `POST /courses`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "courseName": "Bachelor of Technology",
  "courseCode": "B.Tech",
  "durationYears": 4,
  "totalSemesters": 8
}
```

### 4.2 Get All Courses
**Endpoint:** `GET /courses`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

### 4.3 Get Course by ID
**Endpoint:** `GET /courses/{courseId}`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

### 4.4 Update Course
**Endpoint:** `PUT /courses/{courseId}`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

### 4.5 Delete Course
**Endpoint:** `DELETE /courses/{courseId}`  
**Access:** SUPERADMIN, COLLEGEADMIN  
**Headers:** `Authorization: Bearer {token}`

---

## 5. Subject APIs

### 5.1 Create Subject
**Endpoint:** `POST /subjects`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "subjectCode": "CS301",
  "subjectName": "Data Structures and Algorithms",
  "credits": 3,
  "subjectType": "Theory"
}
```

### 5.2 Get All Subjects
**Endpoint:** `GET /subjects`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

### 5.3 Get Subject by ID
**Endpoint:** `GET /subjects/{subjectId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

### 5.4 Update Subject
**Endpoint:** `PUT /subjects/{subjectId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

### 5.5 Delete Subject
**Endpoint:** `DELETE /subjects/{subjectId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

---

## 6. Class APIs

### 6.1 Create Class
**Endpoint:** `POST /classes`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "courseId": 1,
  "academicYear": "2024-2025",
  "semester": 3,
  "section": "A",
  "className": "B.Tech CSE 3rd Sem A 2024-25"
}
```

### 6.2 Get All Classes
**Endpoint:** `GET /classes`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

### 6.3 Get Class by ID
**Endpoint:** `GET /classes/{classId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

### 6.4 Add Subject to Class
**Endpoint:** `POST /classes/{classId}/subjects`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "subjectId": 1
}
```

### 6.5 Delete Class
**Endpoint:** `DELETE /classes/{classId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

---

## 7. Teacher Management APIs

These endpoints provide full faculty lifecycle management.

### 7.1 Create Teacher
**Endpoint:** `POST /teachers`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "username": "prof.kumar",
  "email": "kumar@abc-it.edu",
  "fullName": "Prof. Rajesh Kumar",
  "phone": "+1-234-567-8920",
  "password": "TempPassword123!",
  "employeeId": "EMP001",
  "qualification": "M.Tech, Ph.D",
  "specialization": "Machine Learning",
  "hireDate": "2024-01-15",
  "deptId": 1
}
```

### 7.2 Get All Teachers
**Endpoint:** `GET /teachers`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Description:** Retrieves all teachers within the current college context. Scoped by college ID from token.

### 7.3 Get Teacher by ID
**Endpoint:** `GET /teachers/{teacherId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  

### 7.4 Update Teacher
**Endpoint:** `PUT /teachers/{teacherId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  

### 7.5 Delete Teacher (Soft Delete)
**Endpoint:** `DELETE /teachers/{teacherId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  

---

## 8. Teacher Assignment APIs

### 8.1 Assign Teacher to Class-Subject
**Endpoint:** `POST /teacher-assignments`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "classSubjectId": 1,
  "teacherUserId": 20
}
```

> **Note:** This endpoint is mapped in the ClassController under `/classes/teacher-assignments`.

---

## 9. Enrollment APIs

### 9.1 Enroll Student in Class
**Endpoint:** `POST /enrollments`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "studentUserId": 100,
  "classId": 1
}
```

### 9.2 Get Enrollments by Class
**Endpoint:** `GET /enrollments/class/{classId}`  
**Access:** SUPERADMIN, COLLEGEADMIN, HOD  

---

## 10. Attendance APIs (Teacher)

### 10.1 Mark Attendance
**Endpoint:** `POST /attendance`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

Saves the whole day's register for one assignment in one request, and is **idempotent**:
re-saving the same assignment and date updates the existing rows instead of failing (backed by
the unique index from V6). The caller must be the assigned teacher; a student not enrolled in
the class, or listed twice, gets `400`. Parents are notified only for students newly marked
absent, and never for erased (anonymised) students.

**Request Body:**
```json
{
  "assignmentId": 1,
  "recordDate": "2024-12-12",
  "attendanceRecords": [
    {
      "studentUserId": 100,
      "isPresent": true,
      "remarks": null
    },
    {
      "studentUserId": 101,
      "isPresent": false,
      "remarks": "Medical leave"
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "assignmentId": 1,
    "recordDate": "2024-12-12",
    "totalStudents": 45,
    "presentCount": 42,
    "absentCount": 3,
    "attendancePercentage": 93.33,
    "createdAt": "2024-12-12T12:30:00"
  },
  "timestamp": "2024-12-12T12:30:00"
}
```

### 10.2 Get Attendance by Assignment
**Endpoint:** `GET /attendance/assignment/{assignmentId}`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `startDate` (optional, format: YYYY-MM-DD)
- `endDate` (optional, format: YYYY-MM-DD)

### 10.3 Get Attendance Summary
**Endpoint:** `GET /attendance/assignment/{assignmentId}/summary`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

### 10.4 Update Attendance
**Endpoint:** `PUT /attendance/{attendanceId}`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "isPresent": true,
  "remarks": "Corrected entry"
}
```

### 10.5 Get My Assignments
**Endpoint:** `GET /attendance/my-assignments`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "data": [
    {
      "assignmentId": 1,
      "classId": 1,
      "className": "B.Tech CSE 3rd Sem A 2024-25",
      "subjectId": 1,
      "subjectCode": "CS301",
      "subjectName": "Data Structures and Algorithms",
      "totalStudents": 45,
      "isActive": true
    }
  ],
  "timestamp": "2024-12-12T12:25:00"
}
```

### 10.6 Get Roster
**Endpoint:** `GET /attendance/assignment/{assignmentId}/roster`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

Students enrolled in the assignment's class, i.e. who to mark. The attendance page loads this
plus the day's saved records, then sends the full register to `POST /attendance`.

---

## 11. Attendance APIs (Student)

### 11.1 Get My Attendance
**Endpoint:** `GET /student-attendance/my-attendance`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `semester` (optional, default: current semester)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance retrieved successfully",
  "data": {
    "semester": 3,
    "academicYear": "2024-2025",
    "overallAttendance": {
      "totalClasses": 120,
      "classesAttended": 112,
      "attendancePercentage": 93.33
    },
    "subjectWiseAttendance": [
      {
        "subjectId": 1,
        "subjectCode": "CS301",
        "subjectName": "Data Structures and Algorithms",
        "teacherName": "Prof. Rajesh Kumar",
        "totalClasses": 24,
        "classesAttended": 22,
        "attendancePercentage": 91.67,
        "status": "Good"
      }
    ]
  },
  "timestamp": "2024-12-12T13:15:00"
}
```

### 11.2 Get Attendance by Subject
**Endpoint:** `GET /student-attendance/subject/{subjectId}`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

---

## 12. Marks APIs (Teacher)

### 12.1 Enter Marks
**Endpoint:** `POST /marks`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "assignmentId": 1,
  "examTypeId": 1,
  "marksEntries": [
    {
      "studentUserId": 100,
      "marksObtained": 45.5,
      "remarks": "Good performance"
    },
    {
      "studentUserId": 101,
      "marksObtained": 38.0,
      "remarks": null
    }
  ]
}
```

### 12.2 Get Marks by Assignment
**Endpoint:** `GET /marks/assignment/{assignmentId}`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `examTypeId` (optional)

### 12.3 Get Marks Summary
**Endpoint:** `GET /marks/assignment/{assignmentId}/summary`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

### 12.4 Update Marks
**Endpoint:** `PUT /marks/{markId}`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "marksObtained": 47.0,
  "remarks": "Updated after rechecking"
}
```

### 12.5 Get Exam Types
**Endpoint:** `GET /marks/exam-types`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

---

## 13. Marks APIs (Student)

### 13.1 Get My Marks
**Endpoint:** `GET /student-marks/my-marks`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `semester` (optional, default: current semester)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Mark retrieved successfully",
  "data": {
    "semester": 3,
    "academicYear": "2024-2025",
    "subjects": [
      {
        "subjectId": 1,
        "subjectCode": "CS301",
        "subjectName": "Data Structures and Algorithms",
        "credits": 3,
        "teacherName": "Prof. Rajesh Kumar",
        "examMarks": [
          {
            "examTypeId": 1,
            "examTypeName": "Internal 1",
            "marksObtained": 45.5,
            "maxMarks": 50,
            "percentage": 91.0,
            "remarks": "Good performance"
          }
        ],
        "totalMarksObtained": 93.5,
        "totalMaxMarks": 100,
        "overallPercentage": 93.5
      }
    ],
    "overallPercentage": 91.2
  },
  "timestamp": "2024-12-12T13:10:00"
}
```

### 13.2 Get Marks by Subject
**Endpoint:** `GET /student-marks/subject/{subjectId}`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

---

## 14. Profile APIs

### 14.1 Get My Profile
**Endpoint:** `GET /profile`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "userId": 100,
    "username": "john.doe",
    "email": "john.doe@student.abc-it.edu",
    "fullName": "John Doe",
    "phone": "+1-234-567-8930",
    "collegeId": 1,
    "collegeName": "ABC Institute of Technology",
    "studentProfile": {
      "rollNumber": "CSE2024001",
      "deptId": 1,
      "deptName": "Computer Science and Engineering",
      "courseId": 1,
      "courseName": "Bachelor of Technology",
      "admissionYear": 2024,
      "currentSemester": 3,
      "parentName": "Mr. Robert Doe",
      "parentPhone": "+1-234-567-8940",
      "parentEmail": "robert.doe@email.com",
      "dateOfBirth": "2006-05-15",
      "address": "789 Student Lane, City, State"
    },
    "createdAt": "2024-01-15T10:00:00"
  },
  "timestamp": "2024-12-12T13:00:00"
}
```

### 14.2 Update My Profile
**Endpoint:** `PUT /profile`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "phone": "+1-234-567-8935",
  "email": "john.doe.new@student.abc-it.edu",
  "parentPhone": "+1-234-567-8945",
  "parentEmail": "robert.doe.new@email.com",
  "address": "123 New Address, City, State"
}
```

---

## 15. Dashboard APIs

### 15.1 Teacher Dashboard
**Endpoint:** `GET /dashboard/teacher`  
**Access:** SUPERADMIN, TEACHER  
**Headers:** `Authorization: Bearer {token}`

> **Note:** TeacherDashboardService is currently under development (TODO).

### 15.2 Student Dashboard
**Endpoint:** `GET /dashboard/student`  
**Access:** SUPERADMIN, STUDENT  
**Headers:** `Authorization: Bearer {token}`

---

## 16. Role-Based Access Matrix

| Resource | SUPERADMIN | COLLEGEADMIN | HOD | TEACHER | STUDENT |
|----------|:----------:|:------------:|:---:|:-------:|:-------:|
| **Colleges** (`/colleges`) | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| **Departments** (`/departments`) | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| **Courses** (`/courses`) | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| **Subjects** (`/subjects`) | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ |
| **Classes** (`/classes`) | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ |
| **Teachers** (`/teachers`) | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ |
| **Teacher Assignments** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Enrollments** (`/enrollments`) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Attendance (T)** (`/attendance`) | ✅ | ❌ | ❌ | ✅ own | ❌ |
| **Attendance (S)** (`/student-attendance`) | ✅ | ❌ | ❌ | ❌ | ✅ own |
| **Marks (T)** (`/marks`) | ✅ | ❌ | ❌ | ✅ own | ❌ |
| **Marks (S)** (`/student-marks`) | ✅ | ❌ | ❌ | ❌ | ✅ own |
| **Profile** (`/profile`) | ✅ | ❌ | ❌ | ❌ | ✅ own |
| **Dashboard** | ✅ all | ❌ | ❌ | ✅ own | ✅ own |

### Role Descriptions

| Role | ID | Scope |
|------|:--:|-------|
| **SUPERADMIN** | 1 | System-wide access. Can manage all colleges and all data |
| **COLLEGEADMIN** | 2 | College-scoped. Manages departments, courses, and assigns HODs within their college |
| **HOD** | 3 | Department-scoped. Manages subjects, classes, teachers, enrollments within their department |
| **TEACHER** | 4 | Assignment-scoped. Manages attendance and marks for their assigned class-subjects |
| **STUDENT** | 5 | Self-scoped. Views own profile, marks, and attendance |

---

## 17. Common Response Codes

| Status Code | Description | When to Use |
|-------------|-------------|-------------|
| **200 OK** | Success | GET, PUT, DELETE operations succeeded |
| **201 Created** | Resource created | POST operations succeeded |
| **204 No Content** | Success with no body | DELETE operations with no response |
| **400 Bad Request** | Validation error | Invalid input data |
| **401 Unauthorized** | Authentication failed | Invalid or missing token |
| **403 Forbidden** | Authorization failed | User lacks permissions |
| **404 Not Found** | Resource not found | Requested resource doesn't exist |
| **409 Conflict** | Resource conflict | Duplicate entry, constraint violation |
| **422 Unprocessable Entity** | Business logic error | Valid syntax but business rule violation |
| **500 Internal Server Error** | Server error | Unexpected server-side error |

---

## 18. Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field1": "Error message for field1",
    "field2": "Error message for field2"
  },
  "timestamp": "2024-12-12T13:25:00",
  "path": "/api/v1/endpoint",
  "statusCode": 400
}
```

### Examples

#### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "errors": null,
  "timestamp": "2024-12-12T13:35:00",
  "path": "/api/v1/student-marks/my-marks",
  "statusCode": 401
}
```

#### Authorization Error (403)
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions",
  "errors": null,
  "timestamp": "2024-12-12T13:40:00",
  "path": "/api/v1/colleges",
  "statusCode": 403
}
```

---

## 19. Authentication Header Format

All authenticated endpoints require:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Only **access** tokens are accepted here. Access tokens carry `"typ": "access"`; a refresh token
sent as a bearer token is ignored and the request is treated as unauthenticated.

The JWT token contains `userId`, `collegeId`, `roleId`, and `roleName` claims used for:
1. **Authentication** — Validating the token signature and expiry
2. **Authorization** — Checking role via `@PreAuthorize("hasRole('ROLENAME')")`
3. **Data Scoping** — `TenantContext` ensures users only see data within their college/department

---

## 20. Pagination Format

For list endpoints supporting pagination:

**Request:**
```
GET /api/v1/colleges?page=0&size=20&sort=collegeName,asc
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "content": [...],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 5,
    "totalElements": 100,
    "last": false,
    "first": true,
    "size": 20,
    "number": 0,
    "numberOfElements": 20,
    "empty": false
  },
  "timestamp": "2024-12-12T14:00:00"
}
```

---

## 21. Frontend Route ↔ Backend API Mapping

| Frontend Route | Backend API | Roles |
|----------------|-------------|-------|
| `/login` | `POST /auth/login` | Public |
| `/colleges` | `GET/POST /colleges` | SUPERADMIN |
| `/departments` | `GET/POST /departments` | SUPERADMIN, COLLEGEADMIN |
| `/courses` | `GET/POST /courses` | SUPERADMIN, COLLEGEADMIN |
| `/subjects` | `GET/POST /subjects` | SUPERADMIN, COLLEGEADMIN, HOD |
| `/teachers` | `GET/POST /teachers` | SUPERADMIN, COLLEGEADMIN, HOD |
| `/classes` | `GET/POST /classes` | SUPERADMIN, COLLEGEADMIN, HOD |
| `/attendance` | `GET/POST /attendance` | SUPERADMIN, TEACHER |
| `/marks` | `GET/POST /marks` | SUPERADMIN, TEACHER |
| `/profile` | `GET/PUT /profile` | SUPERADMIN, STUDENT |
| `/student-marks` | `GET /student-marks/my-marks` | SUPERADMIN, STUDENT |
| `/student-attendance` | `GET /student-attendance/my-attendance` | SUPERADMIN, STUDENT |

---

## 22. OpenAPI/Swagger Access

**Swagger UI:** `https://college.example.com/api/v1/swagger-ui.html`  
**OpenAPI Spec:** `https://college.example.com/api/v1/api-docs`

---

## 23. Support API

### 23.1 Submit a Support Query
**Endpoint:** `POST /support`  
**Access:** Any authenticated user (all roles)  
**Headers:** `Authorization: Bearer {token}`

Forwards the query to the ops Discord channel (see
[OBSERVABILITY.md](OBSERVABILITY.md)). Nothing is persisted — there is no ticket list to
fetch back.

**Request Body:**
```json
{
  "subject": "Can't submit attendance for my class",
  "message": "Describe the issue in detail here..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your support query has been submitted",
  "data": null,
  "timestamp": "2026-09-24T08:04:54.131"
}
```

---

## 24. Observability Endpoints

These are Spring Boot Actuator endpoints, not app controllers — responses are Actuator's own
JSON shape, **not** wrapped in the `{ success, message, data, timestamp }` envelope used
everywhere else in this document. All of them are permitted without authentication (required
for Kubernetes probes and Prometheus scraping — see `WebSecurityConfig`). Full details in
[OBSERVABILITY.md](OBSERVABILITY.md).

| Endpoint | Purpose |
|---|---|
| `GET /actuator/health` | Liveness/readiness (`status: UP`/`DOWN` per component — db, redis, disk, ...) |
| `GET /actuator/info` | App name, build version/time (from `build-info.properties`), and `apiVersion` |
| `GET /actuator/metrics` | Spring Boot's own metrics browser |
| `GET /actuator/prometheus` | Prometheus-format metrics for scraping |

---

## 25. Audit Log API

**Endpoint:** `GET /audit-logs`  
**Access:** SUPERADMIN, COLLEGEADMIN (a college admin only ever sees their own college)  
**Headers:** `Authorization: Bearer {token}`

Read-only, newest first. Rows are written automatically by `AuditEventListener` for creates,
updates and deletes of business entities, with a redacted before/after diff in `changes`.

**Query Parameters:** `collegeId`, `action`, `entityType`, `from`, `to` (YYYY-MM-DD), `page`
(default 0), `size` (default 20, max 100).

**Item shape:** `id`, `collegeId`, `actorUserId`, `actorUsername`, `action`, `entityType`,
`entityId`, `changes`, `createdAt`.

---

## 26. Privacy APIs

DPDP notice and consent, data-principal requests (access, correction, erasure), and retention.
Prefix `/privacy`. Full endpoint table, roles and request states:
[foundations/contracts.md](foundations/contracts.md); behaviour and configuration:
[PRIVACY.md](PRIVACY.md).

| Group | Endpoints |
|---|---|
| Self-service (any authenticated user; requests are STUDENT, TEACHER) | `GET /notice/current`, `GET /consents/me`, `POST /consents`, `POST /requests`, `GET /requests/me`, `GET /requests/{id}`, `POST /requests/{id}/cancel`, `GET /requests/{id}/export` |
| Admin (SUPERADMIN read, COLLEGEADMIN act) | `GET /admin/requests`, `GET /admin/requests/{id}`, `POST /admin/requests/{id}/review`, `POST /admin/requests/{id}/resolve`, `GET`/`POST /admin/notices`, `GET`/`PUT /admin/retention-policies`, `POST /admin/retention/run?dryRun=`, `GET /admin/retention/runs`, `GET /admin/audit` |

---

## 27. Knowledge Base APIs

Help articles shown to every role, authored by SUPERADMIN. Articles are global (no college).
Details: [foundations/contracts.md](foundations/contracts.md).

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /knowledgebase/categories` | Authenticated | Categories |
| `GET /knowledgebase/articles?category=&q=&page=&size=` | Authenticated | Published articles visible to the caller's role (no body) |
| `GET /knowledgebase/articles/{slug}` | Authenticated | One article; `404` for drafts or other roles |
| `POST /knowledgebase/articles/{id}/feedback` | Authenticated | `{ "helpful": true }`, one vote per user (upsert) |
| `GET /knowledgebase/admin/articles?q=&status=`, `GET /knowledgebase/admin/articles/{id}` | SUPERADMIN | List and read any article |
| `POST`, `PUT /knowledgebase/admin/articles[/{id}]`, `DELETE /knowledgebase/admin/articles/{id}` | SUPERADMIN | Create, edit (status DRAFT/PUBLISHED/ARCHIVED), delete |
| `POST`, `PUT /knowledgebase/admin/categories[/{id}]`, `DELETE /knowledgebase/admin/categories/{id}` | SUPERADMIN | Manage categories; delete is `422` while it has articles, duplicate slug `409` |

---

**End of API Documentation**