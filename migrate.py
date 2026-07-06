import os
import re
import shutil

SRC_DIR = "/home/harsahavardhanap/Desktop/Harsha/Projects/CollegeManagement/backend/src/main/java"
TEST_SRC_DIR = "/home/harsahavardhanap/Desktop/Harsha/Projects/CollegeManagement/backend/src/test/java"

def get_new_package(old_pkg, class_name):
    # Rule mappings
    if "entity.base" in old_pkg or class_name == "AuditableEntity":
        return "com.edgepoint.core.domain"
    elif "entity" in old_pkg:
        if class_name in ["Class", "ClassSubject", "Subject", "Course", "Department", "TeacherAssignment", "StudentEnrollment", "ExamType", "Mark"]:
            return "com.edgepoint.academic.domain"
        elif class_name == "AttendanceRecord":
            return "com.edgepoint.attendance.domain"
        elif class_name == "StudentProfile":
            return "com.edgepoint.student.domain"
        elif class_name == "TeacherProfile":
            return "com.edgepoint.teacher.domain"
        elif class_name in ["User", "UserRole", "College"]:
            return "com.edgepoint.core.domain"
    elif "repository.base" in old_pkg or class_name == "SoftDeleteRepository":
        return "com.edgepoint.core.repository"
    elif "repository.projection" in old_pkg:
        if class_name == "UserProjection":
            return "com.edgepoint.core.repository.projection"
        elif class_name == "AttendanceProjection":
            return "com.edgepoint.attendance.repository.projection"
        elif class_name == "StudentMarkProjection":
            return "com.edgepoint.academic.repository.projection"
    elif "repository" in old_pkg:
        if class_name in ["CourseRepository", "DepartmentRepository", "SubjectRepository", "ClassRepository", "ClassSubjectRepository", "TeacherAssignmentRepository", "StudentEnrollmentRepository", "ExamTypeRepository", "MarkRepository"]:
            return "com.edgepoint.academic.repository"
        elif class_name == "AttendanceRecordRepository":
            return "com.edgepoint.attendance.repository"
        elif class_name == "StudentProfileRepository":
            return "com.edgepoint.student.repository"
        elif class_name == "TeacherProfileRepository":
            return "com.edgepoint.teacher.repository"
        elif class_name in ["UserRepository", "UserRoleRepository", "CollegeRepository"]:
            return "com.edgepoint.core.repository"
    elif "exception" in old_pkg or class_name in ["ErrorResponse"]:
        return "com.edgepoint.core.exception"
    elif "security" in old_pkg:
        return "com.edgepoint.core.security"
    elif "service.auth" in old_pkg:
        return "com.edgepoint.core.security"
    elif "service.college" in old_pkg:
        return "com.edgepoint.core.service"
    elif "service.course" in old_pkg or "service.department" in old_pkg or "service.subject" in old_pkg or "service.classmanagement" in old_pkg or "service.mark" in old_pkg:
        return "com.edgepoint.academic.service"
    elif "service.attendance" in old_pkg:
        return "com.edgepoint.attendance.service"
    elif "service.student" in old_pkg:
        if class_name in ["StudentAttendanceService", "StudentAttendanceServiceImpl"]:
            return "com.edgepoint.attendance.service"
        elif class_name in ["StudentMarkService", "StudentMarkServiceImpl"]:
            return "com.edgepoint.academic.service"
        else:
            return "com.edgepoint.student.service"
    elif "service.hod" in old_pkg or "service.teacher" in old_pkg:
        return "com.edgepoint.teacher.service"
    elif "controller.admin" in old_pkg:
        return "com.edgepoint.core.controller"
    elif "controller.auth" in old_pkg:
        return "com.edgepoint.core.security"
    elif "controller.collegeadmin" in old_pkg or "controller.hod" in old_pkg or "controller.teacher" in old_pkg or "controller.student" in old_pkg or "controller.management" in old_pkg:
        # Determine based on role/module
        if "TeacherDashboardController" in class_name or "TeacherManagementController" in class_name:
            return "com.edgepoint.teacher.controller"
        elif "Attendance" in class_name:
            return "com.edgepoint.attendance.controller"
        elif "Mark" in class_name:
            return "com.edgepoint.academic.controller"
        elif "Student" in class_name:
            return "com.edgepoint.student.controller"
        else:
            return "com.edgepoint.academic.controller"
    elif "dto" in old_pkg:
        if "attendance" in old_pkg:
            return "com.edgepoint.attendance.dto"
        elif any(x in old_pkg for x in ["department", "course", "subject", "classmanagement", "mark"]):
            return "com.edgepoint.academic.dto"
        elif "student" in old_pkg:
            return "com.edgepoint.student.dto"
        elif "teacher" in old_pkg:
            return "com.edgepoint.teacher.dto"
        elif "college" in old_pkg or "user" in old_pkg:
            return "com.edgepoint.core.dto"
        elif "auth" in old_pkg:
            return "com.edgepoint.core.security.dto"
        elif "response" in old_pkg and class_name == "ApiResponse":
            return "com.edgepoint.core.domain"
    elif "config" in old_pkg or "ProductionApplication" in class_name:
        return "com.edgepoint.config"
    return None

def get_new_test_package(old_pkg, class_name):
    if "unit.service.auth" in old_pkg:
        return "com.edgepoint.core.security"
    elif "unit.service.college" in old_pkg or "unit.service.user" in old_pkg:
        return "com.edgepoint.core.service"
    elif "unit.service.mark" in old_pkg:
        return "com.edgepoint.academic.service"
    elif "integration.api" in old_pkg:
        if "AuthController" in class_name:
            return "com.edgepoint.core.security"
        else:
            return "com.edgepoint.core.controller"
    elif "integration.repository" in old_pkg:
        if "Attendance" in class_name:
            return "com.edgepoint.attendance.repository"
        else:
            return "com.edgepoint.core.repository"
    elif "config" in old_pkg or class_name in ["MockSecurityContext", "WithMockCustomUser", "TestDataBuilder", "TestConfig", "TestConstants", "IntegrationTestBase", "WithMockCustomUserSecurityContextFactory"]:
        return "com.edgepoint.config"
    return "com.edgepoint"

def main():
    class_mapping = {} # Old FQN -> New FQN
    files_to_move = [] # (Old Path, New Path, New Package)

    # 1. Scan Main classes
    for root, dirs, files in os.walk(os.path.join(SRC_DIR, "com/collegeManagement/production")):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                # Read old package
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                pkg_match = re.search(r'package\s+([a-zA-Z0-9\.]+)\s*;', content)
                if not pkg_match:
                    continue
                old_pkg = pkg_match.group(1)
                class_name = os.path.splitext(file)[0]
                
                # Check for obsolete security filters that we don't need
                if class_name in ["JwtAuthenticationFilter", "JwtTokenUtil"]:
                    print(f"Skipping obsolete security file: {class_name}")
                    continue

                new_pkg = get_new_package(old_pkg, class_name)
                if new_pkg:
                    old_fqn = f"{old_pkg}.{class_name}"
                    new_fqn = f"{new_pkg}.{class_name}"
                    class_mapping[old_fqn] = new_fqn
                    
                    new_rel_path = new_pkg.replace(".", "/")
                    new_dir = os.path.join(SRC_DIR, new_rel_path)
                    new_file_path = os.path.join(new_dir, file)
                    files_to_move.append((file_path, new_file_path, new_pkg))
                else:
                    print(f"Could not map main class: {old_pkg}.{class_name}")

    # 2. Scan Test classes
    for root, dirs, files in os.walk(os.path.join(TEST_SRC_DIR, "com/collegeManagement/production")):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                # Read old package
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                pkg_match = re.search(r'package\s+([a-zA-Z0-9\.]+)\s*;', content)
                if not pkg_match:
                    continue
                old_pkg = pkg_match.group(1)
                class_name = os.path.splitext(file)[0]

                new_pkg = get_new_test_package(old_pkg, class_name)
                if new_pkg:
                    old_fqn = f"{old_pkg}.{class_name}"
                    new_fqn = f"{new_pkg}.{class_name}"
                    class_mapping[old_fqn] = new_fqn

                    new_rel_path = new_pkg.replace(".", "/")
                    new_dir = os.path.join(TEST_SRC_DIR, new_rel_path)
                    new_file_path = os.path.join(new_dir, file)
                    files_to_move.append((file_path, new_file_path, new_pkg))
                else:
                    print(f"Could not map test class: {old_pkg}.{class_name}")

    # 3. Move files and update package declaration
    for old_path, new_path, new_pkg in files_to_move:
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        # Read content
        with open(old_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Update package line
        new_content = re.sub(r'package\s+([a-zA-Z0-9\.]+)\s*;', f"package {new_pkg};", content)
        
        # Write to new path
        with open(new_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        # Remove old file
        os.remove(old_path)

    # Add custom mappings for old/new classes that were renamed or already refactored
    class_mapping["com.collegeManagement.production.security.JwtTokenUtil"] = "com.edgepoint.core.security.JwtService"
    class_mapping["com.collegeManagement.production.security.JwtAuthenticationFilter"] = "com.edgepoint.core.security.JwtAuthFilter"
    class_mapping["com.collegeManagement.production.dto.response.ApiResponse"] = "com.edgepoint.core.domain.ApiResponse"

    # Also map all edgepoint classes to make sure
    # 4. Update imports in all Java files under com/edgepoint
    for root, dirs, files in os.walk(os.path.join(SRC_DIR, "com/edgepoint")):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                # Replace sorted by length descending
                for old_fqn, new_fqn in sorted(class_mapping.items(), key=lambda x: -len(x[0])):
                    new_content = re.sub(r'\b' + re.escape(old_fqn) + r'\b', new_fqn, new_content)
                
                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

    for root, dirs, files in os.walk(os.path.join(TEST_SRC_DIR, "com/edgepoint")):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                new_content = content
                for old_fqn, new_fqn in sorted(class_mapping.items(), key=lambda x: -len(x[0])):
                    new_content = re.sub(r'\b' + re.escape(old_fqn) + r'\b', new_fqn, new_content)

                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

    # Clean up empty directories under com/collegeManagement
    for root_dir in [SRC_DIR, TEST_SRC_DIR]:
        old_root = os.path.join(root_dir, "com/collegeManagement")
        if os.path.exists(old_root):
            shutil.rmtree(old_root)

    print("Migration finished successfully.")

if __name__ == "__main__":
    main()
