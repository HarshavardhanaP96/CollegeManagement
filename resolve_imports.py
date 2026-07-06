import os
import re

SRC_DIR = "/home/harsahavardhanap/Desktop/Harsha/Projects/CollegeManagement/backend/src"

CLASS_FQNS = {
    # Core Domain
    "User": "com.edgepoint.core.domain.User",
    "UserRole": "com.edgepoint.core.domain.UserRole",
    "College": "com.edgepoint.core.domain.College",
    "AuditableEntity": "com.edgepoint.core.domain.AuditableEntity",
    "BaseEntity": "com.edgepoint.core.domain.BaseEntity",
    "ApiResponse": "com.edgepoint.core.dto.ApiResponse",
    
    # Core DTOs
    "CollegeCreateRequest": "com.edgepoint.core.dto.CollegeCreateRequest",
    "CollegeUpdateRequest": "com.edgepoint.core.dto.CollegeUpdateRequest",
    "CollegeResponseDTO": "com.edgepoint.core.dto.CollegeResponseDTO",
    "CollegeStatisticsDTO": "com.edgepoint.core.dto.CollegeStatisticsDTO",
    "UserResponseDTO": "com.edgepoint.core.dto.UserResponseDTO",

    # Core Security
    "TenantContext": "com.edgepoint.core.security.TenantContext",
    "JwtService": "com.edgepoint.core.security.JwtService",
    "JwtAuthFilter": "com.edgepoint.core.security.JwtAuthFilter",
    "AuthService": "com.edgepoint.core.security.AuthService",
    "AuthServiceImpl": "com.edgepoint.core.security.AuthServiceImpl",
    "LoginRequest": "com.edgepoint.core.dto.LoginRequest",
    "ChangePasswordRequest": "com.edgepoint.core.dto.ChangePasswordRequest",
    "RefreshTokenRequest": "com.edgepoint.core.dto.RefreshTokenRequest",
    "LoginResponse": "com.edgepoint.core.dto.LoginResponse",

    # Core Exceptions
    "ResourceNotFoundException": "com.edgepoint.core.exception.ResourceNotFoundException",
    "BadRequestException": "com.edgepoint.core.exception.BadRequestException",
    "BusinessRuleViolationException": "com.edgepoint.core.exception.BusinessRuleViolationException",
    "DuplicateResourceException": "com.edgepoint.core.exception.DuplicateResourceException",
    "ErrorResponse": "com.edgepoint.core.exception.ErrorResponse",
    "UnauthorizedException": "com.edgepoint.core.exception.UnauthorizedException",
    "ValidationException": "com.edgepoint.core.exception.ValidationException",
    "AuthenticationException": "com.edgepoint.core.exception.AuthenticationException",

    # Academic Domain
    "Class": "com.edgepoint.academic.domain.Class",
    "ClassSubject": "com.edgepoint.academic.domain.ClassSubject",
    "Subject": "com.edgepoint.academic.domain.Subject",
    "Course": "com.edgepoint.academic.domain.Course",
    "Department": "com.edgepoint.academic.domain.Department",
    "TeacherAssignment": "com.edgepoint.academic.domain.TeacherAssignment",
    "StudentEnrollment": "com.edgepoint.academic.domain.StudentEnrollment",
    "ExamType": "com.edgepoint.academic.domain.ExamType",
    "Mark": "com.edgepoint.academic.domain.Mark",

    # Academic Repositories
    "CourseRepository": "com.edgepoint.academic.repository.CourseRepository",
    "DepartmentRepository": "com.edgepoint.academic.repository.DepartmentRepository",
    "SubjectRepository": "com.edgepoint.academic.repository.SubjectRepository",
    "ClassRepository": "com.edgepoint.academic.repository.ClassRepository",
    "ClassSubjectRepository": "com.edgepoint.academic.repository.ClassSubjectRepository",
    "TeacherAssignmentRepository": "com.edgepoint.academic.repository.TeacherAssignmentRepository",
    "StudentEnrollmentRepository": "com.edgepoint.academic.repository.StudentEnrollmentRepository",
    "ExamTypeRepository": "com.edgepoint.academic.repository.ExamTypeRepository",
    "MarkRepository": "com.edgepoint.academic.repository.MarkRepository",
    "StudentMarkProjection": "com.edgepoint.academic.repository.projection.StudentMarkProjection",

    # Academic Services
    "CourseService": "com.edgepoint.academic.service.CourseService",
    "CourseServiceImpl": "com.edgepoint.academic.service.CourseServiceImpl",
    "DepartmentService": "com.edgepoint.academic.service.DepartmentService",
    "DepartmentServiceImpl": "com.edgepoint.academic.service.DepartmentServiceImpl",
    "SubjectService": "com.edgepoint.academic.service.SubjectService",
    "SubjectServiceImpl": "com.edgepoint.academic.service.SubjectServiceImpl",
    "ClassManagementService": "com.edgepoint.academic.service.ClassManagementService",
    "ClassManagementServiceImpl": "com.edgepoint.academic.service.ClassManagementServiceImpl",
    "MarkService": "com.edgepoint.academic.service.MarkService",
    "MarkServiceImpl": "com.edgepoint.academic.service.MarkServiceImpl",
    "StudentMarkService": "com.edgepoint.academic.service.StudentMarkService",
    "StudentMarkServiceImpl": "com.edgepoint.academic.service.StudentMarkServiceImpl",

    # Academic DTOs
    "AssignHODRequest": "com.edgepoint.academic.dto.AssignHODRequest",
    "DepartmentCreateRequest": "com.edgepoint.academic.dto.DepartmentCreateRequest",
    "DepartmentUpdateRequest": "com.edgepoint.academic.dto.DepartmentUpdateRequest",
    "DepartmentResponseDTO": "com.edgepoint.academic.dto.DepartmentResponseDTO",
    "CourseCreateRequest": "com.edgepoint.academic.dto.CourseCreateRequest",
    "CourseUpdateRequest": "com.edgepoint.academic.dto.CourseUpdateRequest",
    "CourseResponseDTO": "com.edgepoint.academic.dto.CourseResponseDTO",
    "SubjectCreateRequest": "com.edgepoint.academic.dto.SubjectCreateRequest",
    "SubjectUpdateRequest": "com.edgepoint.academic.dto.SubjectUpdateRequest",
    "SubjectResponseDTO": "com.edgepoint.academic.dto.SubjectResponseDTO",
    "ClassCreateRequest": "com.edgepoint.academic.dto.ClassCreateRequest",
    "ClassResponseDTO": "com.edgepoint.academic.dto.ClassResponseDTO",
    "AddSubjectToClassRequest": "com.edgepoint.academic.dto.AddSubjectToClassRequest",
    "TeacherAssignRequest": "com.edgepoint.academic.dto.TeacherAssignRequest",
    "MarkCreateRequest": "com.edgepoint.academic.dto.MarkCreateRequest",
    "MarkUpdateRequest": "com.edgepoint.academic.dto.MarkUpdateRequest",
    "MarkResponseDTO": "com.edgepoint.academic.dto.MarkResponseDTO",
    "ExamTypeDTO": "com.edgepoint.academic.dto.ExamTypeDTO",
    "MarkSummaryDTO": "com.edgepoint.academic.dto.MarkSummaryDTO",
    "SubmitMarksRequest": "com.edgepoint.academic.dto.SubmitMarksRequest",
    "MarkEntry": "com.edgepoint.academic.dto.MarkEntry",
    "PublishMarksRequest": "com.edgepoint.academic.dto.PublishMarksRequest",

    # Attendance Domain
    "AttendanceRecord": "com.edgepoint.attendance.domain.AttendanceRecord",

    # Attendance Repositories
    "AttendanceRecordRepository": "com.edgepoint.attendance.repository.AttendanceRecordRepository",
    "AttendanceProjection": "com.edgepoint.attendance.repository.projection.AttendanceProjection",

    # Attendance Services
    "AttendanceService": "com.edgepoint.attendance.service.AttendanceService",
    "AttendanceServiceImpl": "com.edgepoint.attendance.service.AttendanceServiceImpl",
    "StudentAttendanceService": "com.edgepoint.attendance.service.StudentAttendanceService",
    "StudentAttendanceServiceImpl": "com.edgepoint.attendance.service.StudentAttendanceServiceImpl",

    # Attendance DTOs
    "AttendanceCreateRequest": "com.edgepoint.attendance.dto.AttendanceCreateRequest",
    "AttendanceUpdateRequest": "com.edgepoint.attendance.dto.AttendanceUpdateRequest",
    "AttendanceResponseDTO": "com.edgepoint.attendance.dto.AttendanceResponseDTO",
    "AttendanceSummaryDTO": "com.edgepoint.attendance.dto.AttendanceSummaryDTO",
    "AttendanceCounters": "com.edgepoint.attendance.dto.AttendanceCounters",
    "AttendanceRecordDto": "com.edgepoint.attendance.dto.AttendanceRecordDto",
    "AttendanceReport": "com.edgepoint.attendance.dto.AttendanceReport",
    "BatchAttendanceRequest": "com.edgepoint.attendance.dto.BatchAttendanceRequest",
    "MarkAttendanceRequest": "com.edgepoint.attendance.dto.MarkAttendanceRequest",
    "StudentAttendanceSummary": "com.edgepoint.attendance.dto.StudentAttendanceSummary",

    # Student Domain
    "StudentProfile": "com.edgepoint.student.domain.StudentProfile",

    # Student Repositories
    "StudentProfileRepository": "com.edgepoint.student.repository.StudentProfileRepository",

    # Student Services
    "StudentProfileService": "com.edgepoint.student.service.StudentProfileService",
    "StudentProfileServiceImpl": "com.edgepoint.student.service.StudentProfileServiceImpl",
    "StudentManagementService": "com.edgepoint.student.service.StudentManagementService",
    "StudentManagementServiceImpl": "com.edgepoint.student.service.StudentManagementServiceImpl",
    "StudentDashboardService": "com.edgepoint.student.service.StudentDashboardService",
    "StudentDashBoardServiceImpl": "com.edgepoint.student.service.StudentDashBoardServiceImpl",

    # Student DTOs
    "StudentCreateRequest": "com.edgepoint.student.dto.StudentCreateRequest",
    "StudentUpdateRequest": "com.edgepoint.student.dto.StudentUpdateRequest",
    "StudentProfileUpdateRequest": "com.edgepoint.student.dto.StudentProfileUpdateRequest",
    "StudentResponseDTO": "com.edgepoint.student.dto.StudentResponseDTO",
    "StudentProfileDTO": "com.edgepoint.student.dto.StudentProfileDTO",
    "SubjectAttendanceDTO": "com.edgepoint.student.dto.SubjectAttendanceDTO",
    "SubjectMarkDTO": "com.edgepoint.student.dto.SubjectMarkDTO",
    "StudentDashBoardDTO": "com.edgepoint.student.dto.StudentDashBoardDTO",
    "ExamMarkDTO": "com.edgepoint.student.dto.ExamMarkDTO",

    # Teacher Domain
    "TeacherProfile": "com.edgepoint.teacher.domain.TeacherProfile",

    # Teacher Repositories
    "TeacherProfileRepository": "com.edgepoint.teacher.repository.TeacherProfileRepository",

    # Teacher Services
    "TeacherManagementService": "com.edgepoint.teacher.service.TeacherManagementService",
    "TeacherManagementServiceImpl": "com.edgepoint.teacher.service.TeacherManagementServiceImpl",
    "TeacherDashboardService": "com.edgepoint.teacher.service.TeacherDashboardService",
    "TeacherDashboardServiceImpl": "com.edgepoint.teacher.service.TeacherDashboardServiceImpl",

    # Teacher DTOs
    "TeacherCreateRequest": "com.edgepoint.teacher.dto.TeacherCreateRequest",
    "TeacherUpdateRequest": "com.edgepoint.teacher.dto.TeacherUpdateRequest",
    "TeacherResponseDTO": "com.edgepoint.teacher.dto.TeacherResponseDTO",
    "TeacherAssignmentDTO": "com.edgepoint.teacher.dto.TeacherAssignmentDTO",
    "RecentActivityDTO": "com.edgepoint.teacher.dto.RecentActivityDTO",
    "TeacherDashboardDTO": "com.edgepoint.teacher.dto.TeacherDashboardDTO",

    # Core Infrastructure / Repositories
    "UserRepository": "com.edgepoint.core.repository.UserRepository",
    "UserRoleRepository": "com.edgepoint.core.repository.UserRoleRepository",
    "CollegeRepository": "com.edgepoint.core.repository.CollegeRepository",
    "SoftDeleteRepository": "com.edgepoint.core.repository.SoftDeleteRepository",

    # Test Utilities
    "MockSecurityContext": "com.edgepoint.config.MockSecurityContext",
    "WithMockCustomUser": "com.edgepoint.config.WithMockCustomUser",
    "TestDataBuilder": "com.edgepoint.config.TestDataBuilder",
    "TestConfig": "com.edgepoint.config.TestConfig",
    "TestConstants": "com.edgepoint.config.TestConstants",
    "IntegrationTestBase": "com.edgepoint.config.IntegrationTestBase",
    "WithMockCustomUserSecurityContextFactory": "com.edgepoint.config.WithMockCustomUserSecurityContextFactory",
}

def resolve_imports():
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Get package declaration
                pkg_match = re.search(r'package\s+([a-zA-Z0-9\.]+)\s*;', content)
                if not pkg_match:
                    continue
                pkg = pkg_match.group(1)

                # Get the class name of the current file to prevent self-import
                curr_class = os.path.splitext(file)[0]

                # Find all referenced classes from our map
                referenced = []
                for class_name, fqn in CLASS_FQNS.items():
                    if class_name == curr_class:
                        continue
                    
                    # Regex for matching word boundaries of the class name
                    # Avoid matching when it's part of another word or string
                    pattern = r'\b' + re.escape(class_name) + r'\b'
                    if re.search(pattern, content):
                        # Calculate class package
                        class_pkg = ".".join(fqn.split(".")[:-1])
                        if class_pkg != pkg:
                            # It's in a different package, must import
                            # Check if already imported
                            import_stmt = f"import {fqn};"
                            if import_stmt not in content:
                                referenced.append(fqn)

                if referenced:
                    # Insert imports after the package statement
                    print(f"Adding imports to {file}: {referenced}")
                    import_lines = "\n".join([f"import {fqn};" for fqn in sorted(referenced)])
                    
                    # Replace package line with package line + imports
                    pkg_line = pkg_match.group(0)
                    new_content = content.replace(pkg_line, f"{pkg_line}\n\n{import_lines}")
                    
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    resolve_imports()
    print("Imports resolved successfully.")
