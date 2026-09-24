package com.edgepoint.academic.service;

import com.edgepoint.academic.domain.AcademicClass;
import com.edgepoint.academic.domain.Department;
import com.edgepoint.academic.domain.StudentEnrollment;
import com.edgepoint.academic.dto.EnrollmentCreateRequest;
import com.edgepoint.academic.dto.EnrollmentResponseDTO;
import com.edgepoint.academic.repository.ClassRepository;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.academic.repository.StudentEnrollmentRepository;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private static final Integer STUDENT_ROLE_ID = 5;

    private final StudentEnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public EnrollmentResponseDTO enrollStudent(EnrollmentCreateRequest request) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + request.getClassId()));

        validateAccess(classEntity.getDeptId());

        User student = userRepository.findById(request.getStudentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + request.getStudentUserId()));

        if (!STUDENT_ROLE_ID.equals(student.getRoleId())) {
            throw new BadRequestException("User " + request.getStudentUserId() + " is not a student");
        }

        if (enrollmentRepository.existsByStudentUserIdAndClassIdAndEnrollmentStatusAndIsDeletedFalse(
                request.getStudentUserId(), request.getClassId(), "Active")) {
            throw new DuplicateResourceException("Student is already enrolled in this class");
        }

        StudentEnrollment enrollment = new StudentEnrollment();
        enrollment.setStudentUserId(request.getStudentUserId());
        enrollment.setClassId(request.getClassId());
        enrollment.setEnrollmentStatus("Active");
        enrollment.setCreatedBy(tenantContext.getCurrentUserId());

        StudentEnrollment saved = enrollmentRepository.save(enrollment);
        log.info("Student {} enrolled in class {}", request.getStudentUserId(), request.getClassId());

        return mapToResponseDTO(saved, student, classEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponseDTO> getEnrollmentsByClass(Integer classId) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        validateAccess(classEntity.getDeptId());

        return enrollmentRepository.findActiveByClassId(classId).stream()
                .map(e -> mapToResponseDTO(e, e.getStudent(), classEntity))
                .collect(Collectors.toList());
    }

    /** SUPERADMIN may access any class; everyone else must belong to the class's own department. */
    private void validateAccess(Integer classDeptId) {
        Integer currentRoleId = tenantContext.getRoleId();
        if (currentRoleId != null && currentRoleId == 1) return;

        // HOD is further scoped to their own department; COLLEGEADMIN/SUPERADMIN checked by college below.
        if (currentRoleId != null && currentRoleId == 3) {
            Integer hodUserId = tenantContext.getCurrentUserId();
            Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(classDeptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            if (!hodUserId.equals(department.getDeptHeadUserId())) {
                throw new BadRequestException("You are not the HOD of this department");
            }
            return;
        }

        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(classDeptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        if (!department.getCollegeId().equals(tenantContext.getCollegeId())) {
            throw new BadRequestException("Access denied to this class");
        }
    }

    private EnrollmentResponseDTO mapToResponseDTO(StudentEnrollment enrollment, User student, AcademicClass classEntity) {
        EnrollmentResponseDTO dto = new EnrollmentResponseDTO();
        dto.setEnrollmentId(enrollment.getEnrollmentId());
        dto.setStudentUserId(enrollment.getStudentUserId());
        dto.setStudentName(student.getFullName());
        StudentProfile profile = studentProfileRepository
                .findByStudentUserIdAndIsDeletedFalse(enrollment.getStudentUserId())
                .orElse(null);
        dto.setRollNumber(profile != null ? profile.getRollNumber() : null);
        dto.setClassId(enrollment.getClassId());
        dto.setClassName(classEntity.getClassName());
        dto.setEnrollmentStatus(enrollment.getEnrollmentStatus());
        dto.setCreatedAt(enrollment.getCreatedAt());
        return dto;
    }
}
