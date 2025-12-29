# College Management System - API Documentation

**Version:** 1.0  
**Base URL:** `https://college.example.com/api/v1`  
**Authentication:** JWT Bearer Token

---

## Table of Contents
1. [Authentication APIs](#1-authentication-apis)
2. [SuperAdmin APIs](#2-superadmin-apis)
3. [CollegeAdmin APIs](#3-collegeadmin-apis)
4. [HOD APIs](#4-hod-apis)
5. [Teacher APIs](#5-teacher-apis)
6. [Student APIs](#6-student-apis)
7. [Common Response Codes](#7-common-response-codes)
8. [Error Handling](#8-error-handling)

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
    "user": {
      "userId": 123,
      "username": "john.doe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "roleId": 4,
      "roleName": "Teacher",
      "collegeId": 5,
      "collegeName": "ABC Institute of Technology"
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

### 1.2 Refresh Token
**Endpoint:** `POST /auth/refresh-token`  
**Access:** Authenticated  
**Description:** Refresh expired JWT token

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
    "expiresIn": 86400000
  },
  "timestamp": "2024-12-12T10:35:00"
}
```

### 1.3 Logout
**Endpoint:** `POST /auth/logout`  
**Access:** Authenticated  
**Headers:** `Authorization: Bearer {token}`

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
  "message": "Password changed successfully",
  "data": null,
  "timestamp": "2024-12-12T10:45:00"
}
```

---

## 2. SuperAdmin APIs

### 2.1 Create College
**Endpoint:** `POST /admin/colleges`  
**Access:** SuperAdmin only  
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

**Validation Errors (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "collegeCode": "College code must be unique",
    "contactEmail": "Invalid email format"
  },
  "timestamp": "2024-12-12T10:50:00"
}
```

### 2.2 Get All Colleges
**Endpoint:** `GET /admin/colleges`  
**Access:** SuperAdmin only  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (optional, default: 0)
- `size` (optional, default: 20)
- `sort` (optional, default: "collegeName,asc")
- `search` (optional) - Search by name or code

**Example:** `GET /admin/colleges?page=0&size=10&search=ABC`

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
**Endpoint:** `GET /admin/colleges/{collegeId}`  
**Access:** SuperAdmin only  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "College retrieved successfully",
  "data": {
    "collegeId": 1,
    "collegeName": "ABC Institute of Technology",
    "collegeCode": "ABC-IT",
    "address": "123 Main Street, City, State - 12345",
    "contactEmail": "admin@abc-it.edu",
    "contactPhone": "+1-234-567-8900",
    "departments": [
      {
        "deptId": 1,
        "deptName": "Computer Science and Engineering",
        "deptCode": "CSE",
        "hodName": "Dr. Jane Smith"
      }
    ],
    "courses": [
      {
        "courseId": 1,
        "courseName": "Bachelor of Technology",
        "courseCode": "B.Tech"
      }
    ],
    "statistics": {
      "totalDepartments": 5,
      "totalTeachers": 85,
      "totalStudents": 1250,
      "totalClasses": 48
    },
    "createdAt": "2024-12-12T10:50:00"
  },
  "timestamp": "2024-12-12T11:05:00"
}
```

### 2.4 Update College
**Endpoint:** `PUT /admin/colleges/{collegeId}`  
**Access:** SuperAdmin only  
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

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "College updated successfully",
  "data": {
    "collegeId": 1,
    "collegeName": "ABC Institute of Technology and Management",
    "collegeCode": "ABC-IT",
    "address": "456 New Address, City, State - 12345",
    "contactEmail": "newadmin@abc-it.edu",
    "contactPhone": "+1-234-567-8901",
    "updatedAt": "2024-12-12T11:10:00",
    "updatedBy": 1
  },
  "timestamp": "2024-12-12T11:10:00"
}
```

### 2.5 Delete College (Soft Delete)
**Endpoint:** `DELETE /admin/colleges/{collegeId}`  
**Access:** SuperAdmin only  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "College deleted successfully",
  "data": null,
  "timestamp": "2024-12-12T11:15:00"
}
```

---

## 3. CollegeAdmin APIs

### 3.1 Create Department
**Endpoint:** `POST /college-admin/departments`  
**Access:** CollegeAdmin only  
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
**Endpoint:** `GET /college-admin/departments`  
**Access:** CollegeAdmin only  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Departments retrieved successfully",
  "data": [
    {
      "deptId": 1,
      "deptName": "Computer Science and Engineering",
      "deptCode": "CSE",
      "deptHeadUserId": 10,
      "deptHeadName": "Dr. Jane Smith",
      "totalTeachers": 15,
      "totalStudents": 250,
      "totalSubjects": 32,
      "createdAt": "2024-12-12T11:20:00"
    }
  ],
  "timestamp": "2024-12-12T11:25:00"
}
```

### 3.3 Assign HOD to Department
**Endpoint:** `PUT /college-admin/departments/{deptId}/assign-hod`  
**Access:** CollegeAdmin only  
**Headers:** `Authorization: Bearer {token}`

**Request Body (Option 1: Create New HOD):**
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

**Request Body (Option 2: Assign Existing User):**
```json
{
  "createNew": false,
  "userId": 10
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "HOD assigned successfully",
  "data": {
    "deptId": 1,
    "deptName": "Computer Science and Engineering",
    "deptHeadUserId": 10,
    "deptHeadName": "Dr. Jane Smith",
    "updatedAt": "2024-12-12T11:30:00"
  },
  "timestamp": "2024-12-12T11:30:00"
}
```

### 3.4 Create Course
**Endpoint:** `POST /college-admin/courses`  
**Access:** CollegeAdmin only  
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

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "courseId": 1,
    "collegeId": 1,
    "courseName": "Bachelor of Technology",
    "courseCode": "B.Tech",
    "durationYears": 4,
    "totalSemesters": 8,
    "createdAt": "2024-12-12T11:35:00"
  },
  "timestamp": "2024-12-12T11:35:00"
}
```

### 3.5 Get All Courses
**Endpoint:** `GET /college-admin/courses`  
**Access:** CollegeAdmin only  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "courseId": 1,
      "courseName": "Bachelor of Technology",
      "courseCode": "B.Tech",
      "durationYears": 4,
      "totalSemesters": 8,
      "totalStudents": 1000,
      "createdAt": "2024-12-12T11:35:00"
    }
  ],
  "timestamp": "2024-12-12T11:40:00"
}
```

---

## 4. HOD APIs

### 4.1 Create Subject
**Endpoint:** `POST /hod/subjects`  
**Access:** HOD only  
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

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "subjectId": 1,
    "deptId": 1,
    "subjectCode": "CS301",
    "subjectName": "Data Structures and Algorithms",
    "credits": 3,
    "subjectType": "Theory",
    "createdAt": "2024-12-12T11:45:00"
  },
  "timestamp": "2024-12-12T11:45:00"
}
```

### 4.2 Get All Subjects
**Endpoint:** `GET /hod/subjects`  
**Access:** HOD only  
**Headers:** `Authorization: Bearer {token}`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "subjectId": 1,
      "subjectCode": "CS301",
      "subjectName": "Data Structures and Algorithms",
      "credits": 3,
      "subjectType": "Theory",
      "totalClasses": 3,
      "totalTeachersAssigned": 2,
      "createdAt": "2024-12-12T11:45:00"
    }
  ],
  "timestamp": "2024-12-12T11:50:00"
}
```

### 4.3 Create Teacher
**Endpoint:** `POST /hod/teachers`  
**Access:** HOD only  
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
  "hireDate": "2024-01-15"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": {
    "userId": 20,
    "username": "prof.kumar",
    "email": "kumar@abc-it.edu",
    "fullName": "Prof. Rajesh Kumar",
    "phone": "+1-234-567-8920",
    "roleId": 4,
    "roleName": "Teacher",
    "teacherProfile": {
      "employeeId": "EMP001",
      "deptId": 1,
      "qualification": "M.Tech, Ph.D",
      "specialization": "Machine Learning",
      "hireDate": "2024-01-15"
    },
    "createdAt": "2024-12-12T12:00:00"
  },
  "timestamp": "2024-12-12T12:00:00"
}
```

### 4.4 Create Class
**Endpoint:** `POST /hod/classes`  
**Access:** HOD only  
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

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "classId": 1,
    "deptId": 1,
    "courseId": 1,
    "courseName": "Bachelor of Technology",
    "academicYear": "2024-2025",
    "semester": 3,
    "section": "A",
    "className": "B.Tech CSE 3rd Sem A 2024-25",
    "totalStudents": 0,
    "totalSubjects": 0,
    "createdAt": "2024-12-12T12:05:00"
  },
  "timestamp": "2024-12-12T12:05:00"
}
```

### 4.5 Add Subject to Class
**Endpoint:** `POST /hod/classes/{classId}/subjects`  
**Access:** HOD only  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "subjectId": 1
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Subject added to class successfully",
  "data": {
    "classSubjectId": 1,
    "classId": 1,
    "subjectId": 1,
    "subjectCode": "CS301",
    "subjectName": "Data Structures and Algorithms",
    "credits": 3,
    "assignedTeachers": [],
    "createdAt": "2024-12-12T12:10:00"
  },
  "timestamp": "2024-12-12T12:10:00"
}
```

### 4.6 Assign Teacher to Class-Subject
**Endpoint:** `POST /hod/teacher-assignments`  
**Access:** HOD only  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "classSubjectId": 1,
  "teacherUserId": 20
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Teacher assigned successfully",
  "data": {
    "assignmentId": 1,
    "classSubjectId": 1,
    "className": "B.Tech CSE 3rd Sem A 2024-25",
    "subjectName": "Data Structures and Algorithms",
    "teacherUserId": 20,
    "teacherName": "Prof. Rajesh Kumar",
    "isActive": true,
    "createdAt": "2024-12-12T12:15:00"
  },
  "timestamp": "2024-12-12T12:15:00"
}
```

### 4.7 Enroll Student in Class
**Endpoint:** `POST /hod/student-enrollments`  
**Access:** HOD only  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "studentUserId": 100,
  "classId": 1
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "enrollmentId": 1,
    "studentUserId": 100,
    "studentName": "John Doe",
    "rollNumber": "CSE2024001",
    "classId": 1,
    "className": "B.Tech CSE 3rd Sem A 2024-25",
    "enrollmentStatus": "Active",
    "createdAt": "2024-12-12T12:20:00"
  },
  "timestamp": "2024-12-12T12:20:00"
}
```

---

## 5. Teacher APIs

### 5.1 Get My Assignments
**Endpoint:** `GET /teachers/assignments`  
**Access:** Teacher only  
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

### 5.2 Mark Attendance
**Endpoint:** `POST /teachers/attendance`  
**Access:** Teacher only  
**Headers:** `Authorization: Bearer {token}`

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

### 5.3 Get Attendance History
**Endpoint:** `GET /teachers/attendance/assignment/{assignmentId}`  
**Access:** Teacher only  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `startDate` (optional, format: YYYY-MM-DD)
- `endDate` (optional, format: YYYY-MM-DD)
- `studentUserId` (optional)

**Example:** `GET /teachers/attendance/assignment/1?startDate=2024-12-01&endDate=2024-12-12`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance history retrieved successfully",
  "data": [
    {
      "recordDate": "2024-12-12",
      "studentUserId": 100,
      "studentName": "John Doe",
      "rollNumber": "CSE2024001",
      "isPresent": true,
      "remarks": null,
      "createdAt": "2024-12-12T12:30:00"
    },
    {
      "recordDate": "2024-12-11",
      "studentUserId": 100,
      "studentName": "John Doe",
      "rollNumber": "CSE2024001",
      "isPresent": true,
      "remarks": null,
      "createdAt": "2024-12-11T10:00:00"
    }
  ],
  "timestamp": "2024-12-12T12:35:00"
}
```

### 5.4 Update Attendance
**Endpoint:** `PUT /teachers/attendance/{attendanceId}`  
**Access:** Teacher only  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "isPresent": true,
  "remarks": "Corrected entry"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "attendanceId": 1,
    "studentUserId": 100,
    "studentName": "John Doe",
    "recordDate": "2024-12-12",
    "isPresent": true,
    "remarks": "Corrected entry",
    "updatedAt": "2024-12-12T12:40:00"
  },
  "timestamp": "2024-12-12T12:40:00"
}
```

### 5.5 Enter Marks
**Endpoint:** `POST /teachers/marks`  
**Access:** Teacher only  
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

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Marks entered successfully",
  "data": {
    "assignmentId": 1,
    "examTypeId": 1,
    "examTypeName": "Internal 1",
    "maxMarks": 50,
    "totalStudents": 45,
    "marksEntered": 45,
    "averageMarks": 40.25,
    "createdAt": "2024-12-12T12:45:00"
  },
  "timestamp": "2024-12-12T12:45:00"
}
```

### 5.6 Get Marks by Assignment
**Endpoint:** `GET /teachers/marks/assignment/{assignmentId}`  
**Access:** Teacher only  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `examTypeId` (optional)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Marks retrieved successfully",
  "data": [
    {
      "markId": 1,
      "studentUserId": 100,
      "studentName": "John Doe",
      "rollNumber": "CSE2024001",
      "examTypeId": 1,
      "examTypeName": "Internal 1",
      "marksObtained": 45.5,
      "maxMarks": 50,
      "percentage": 91.0,
      "remarks": "Good performance",
      "createdAt": "2024-12-12T12:45:00"
    }
  ],
  "timestamp": "2024-12-12T12:50:00"
}
```

### 5.7 Update Marks
**Endpoint:** `PUT /teachers/marks/{markId}`  
**Access:** Teacher only  
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "marksObtained": 47.0,
  "remarks": "Updated after rechecking"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Marks updated successfully",
  "data": {
    "markId": 1,
    "studentUserId": 100,
    "studentName": "John Doe",
    "marksObtained": 47.0,
    "maxMarks": 50,
    "percentage": 94.0,
    "remarks": "Updated after rechecking",
    "updatedAt": "2024-12-12T12:55:00"
  },
  "timestamp": "2024-12-12T12:55:00"
}
```

---

## 6. Student APIs

### 6.1 Get My Profile
**Endpoint:** `GET /students/profile`  
**Access:** Student only  
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

### 6.2 Update My Profile
**Endpoint:** `PUT /students/profile`  
**Access:** Student only  
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

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": 100,
    "email": "john.doe.new@student.abc-it.edu",
    "phone": "+1-234-567-8935",
    "studentProfile": {
      "parentPhone": "+1-234-567-8945",
      "parentEmail": "robert.doe.new@email.com",
      "address": "123 New Address, City, State"
    },
    "updatedAt": "2024-12-12T13:05:00"
  },
  "timestamp": "2024-12-12T13:05:00"
}
```

### 6.3 Get My Marks
**Endpoint:** `GET /students/marks/my-marks`  
**Access:** Student only  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `semester` (optional, default: current semester)
- `subjectId` (optional)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Marks retrieved successfully",
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
          },
          {
            "examTypeId": 2,
            "examTypeName": "Internal 2",
            "marksObtained": 48.0,
            "maxMarks": 50,
            "percentage": 96.0,
            "remarks": null
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

### 6.4 Get My Attendance
**Endpoint:** `GET /students/attendance/my-attendance`  
**Access:** Student only  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `semester` (optional, default: current semester)
- `subjectId` (optional)

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

### 6.5 Get Attendance Details by Subject
**Endpoint:** `GET /students/attendance/subject/{subjectId}`  
**Access:** Student only  
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance details retrieved successfully",
  "data": {
    "subjectId": 1,
    "subjectName": "Data Structures and Algorithms",
    "teacherName": "Prof. Rajesh Kumar",
    "attendanceRecords": [
      {
        "recordDate": "2024-12-12",
        "isPresent": true,
        "remarks": null
      },
      {
        "recordDate": "2024-12-11",
        "isPresent": true,
        "remarks": null
      },
      {
        "recordDate": "2024-12-09",
        "isPresent": false,
        "remarks": "Medical leave"
      }
    ],
    "summary": {
      "totalClasses": 24,
      "classesAttended": 22,
      "attendancePercentage": 91.67
    }
  },
  "timestamp": "2024-12-12T13:20:00"
}
```

---

## 7. Common Response Codes

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

## 8. Error Handling

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

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters",
    "phone": "Invalid phone number format"
  },
  "timestamp": "2024-12-12T13:30:00",
  "path": "/api/v1/auth/login",
  "statusCode": 400
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "errors": null,
  "timestamp": "2024-12-12T13:35:00",
  "path": "/api/v1/students/marks/my-marks",
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
  "path": "/api/v1/admin/colleges",
  "statusCode": 403
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "message": "Resource not found",
  "errors": {
    "collegeId": "College with ID 999 does not exist"
  },
  "timestamp": "2024-12-12T13:45:00",
  "path": "/api/v1/admin/colleges/999",
  "statusCode": 404
}
```

#### Conflict Error (409)
```json
{
  "success": false,
  "message": "Resource already exists",
  "errors": {
    "collegeCode": "College code 'ABC-IT' already exists",
    "email": "Email 'admin@abc-it.edu' already registered"
  },
  "timestamp": "2024-12-12T13:50:00",
  "path": "/api/v1/admin/colleges",
  "statusCode": 409
}
```

#### Business Logic Error (422)
```json
{
  "success": false,
  "message": "Business rule violation",
  "errors": {
    "marks": "Marks obtained (55) cannot exceed maximum marks (50)"
  },
  "timestamp": "2024-12-12T13:55:00",
  "path": "/api/v1/teachers/marks",
  "statusCode": 422
}
```

---

## 9. Authentication Header Format

All authenticated endpoints require:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 10. Pagination Format

For list endpoints supporting pagination:

**Request:**
```
GET /api/v1/admin/colleges?page=0&size=20&sort=collegeName,asc
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

## 11. OpenAPI/Swagger Access

**Swagger UI:** `https://college.example.com/api/v1/swagger-ui.html`  
**OpenAPI Spec:** `https://college.example.com/api/v1/api-docs`

---

**End of API Documentation**