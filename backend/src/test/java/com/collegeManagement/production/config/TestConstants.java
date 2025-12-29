// ============================================
// src/test/java/com/collegeManagement/util/TestConstants.java
// ============================================

package com.collegeManagement.production.config;

public class TestConstants {

    // API Endpoints
    public static final String API_V1 = "/api/v1";
    public static final String AUTH_ENDPOINT = API_V1 + "/auth";
    public static final String LOGIN_ENDPOINT = AUTH_ENDPOINT + "/login";
    public static final String LOGOUT_ENDPOINT = AUTH_ENDPOINT + "/logout";
    public static final String CHANGE_PASSWORD_ENDPOINT = AUTH_ENDPOINT + "/change-password";

    public static final String ADMIN_ENDPOINT = API_V1 + "/admin";
    public static final String COLLEGES_ENDPOINT = ADMIN_ENDPOINT + "/colleges";

    public static final String COLLEGE_ADMIN_ENDPOINT = API_V1 + "/college-admin";
    public static final String DEPARTMENTS_ENDPOINT = COLLEGE_ADMIN_ENDPOINT + "/departments";
    public static final String COURSES_ENDPOINT = COLLEGE_ADMIN_ENDPOINT + "/courses";

    public static final String HOD_ENDPOINT = API_V1 + "/hod";
    public static final String SUBJECTS_ENDPOINT = HOD_ENDPOINT + "/subjects";
    public static final String TEACHERS_ENDPOINT = HOD_ENDPOINT + "/teachers";
    public static final String CLASSES_ENDPOINT = HOD_ENDPOINT + "/classes";

    public static final String TEACHER_ENDPOINT = API_V1 + "/teachers";
    public static final String ATTENDANCE_ENDPOINT = TEACHER_ENDPOINT + "/attendance";
    public static final String MARKS_ENDPOINT = TEACHER_ENDPOINT + "/marks";

    public static final String STUDENT_ENDPOINT = API_V1 + "/students";
    public static final String MY_MARKS_ENDPOINT = STUDENT_ENDPOINT + "/marks/my-marks";
    public static final String MY_ATTENDANCE_ENDPOINT = STUDENT_ENDPOINT + "/attendance/my-attendance";

    // Test Users
    public static final String SUPERADMIN_USERNAME = "superadmin";
    public static final String SUPERADMIN_PASSWORD = "Admin@123";

    public static final String TEST_COLLEGE_CODE = "TEST-COL";
    public static final String TEST_DEPT_CODE = "CSE";
    public static final String TEST_SUBJECT_CODE = "CS301";

    // JWT
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";
}