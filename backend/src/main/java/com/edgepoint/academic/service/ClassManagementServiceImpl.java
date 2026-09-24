// src/main/java/com/collegeManagement/service/classmanagement/ClassManagementServiceImpl.java
package com.edgepoint.academic.service;


import com.edgepoint.academic.domain.Subject;
import com.edgepoint.academic.repository.ClassRepository;
import com.edgepoint.academic.repository.ClassSubjectRepository;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.academic.repository.SubjectRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;

import com.edgepoint.academic.dto.AddSubjectToClassRequest;
import com.edgepoint.academic.dto.ClassCreateRequest;
import com.edgepoint.academic.dto.ClassSubjectResponseDTO;
import com.edgepoint.academic.dto.TeacherAssignRequest;
import com.edgepoint.academic.dto.TeacherAssignmentResponseDTO;
import com.edgepoint.academic.dto.ClassResponseDTO;
import com.edgepoint.academic.domain.AcademicClass;
import com.edgepoint.academic.domain.ClassSubject;
import com.edgepoint.academic.domain.TeacherAssignment;

import com.edgepoint.academic.domain.Department;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassManagementServiceImpl implements ClassManagementService {

    private final ClassRepository classRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public ClassResponseDTO createClass(ClassCreateRequest request) {
        // Get HOD's department
        Integer hodUserId = tenantContext.getCurrentUserId();
        Department department = departmentRepository.findByDeptHeadUserIdAndIsDeletedFalse(hodUserId)
                .orElseThrow(() -> new BadRequestException("You are not assigned as HOD of any department"));

        AcademicClass classEntity = new AcademicClass();
        classEntity.setDeptId(department.getDeptId());
        classEntity.setCourseId(request.getCourseId());
        classEntity.setAcademicYear(request.getAcademicYear());
        classEntity.setSemester(request.getSemester());
        classEntity.setSection(request.getSection());
        classEntity.setClassName(request.getClassName());
        classEntity.setCreatedBy(hodUserId);

        AcademicClass saved = classRepository.save(classEntity);
        log.info("AcademicClass created: {} (ID: {})", saved.getClassName(), saved.getClassId());

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public ClassResponseDTO addSubjectToClass(Integer classId, AddSubjectToClassRequest request) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass not found: " + classId));

        validateHODAccess(classEntity.getDeptId());

        if (classSubjectRepository.existsByClassIdAndSubjectIdAndIsDeletedFalse(
                classId, request.getSubjectId())) {
            throw new DuplicateResourceException("Subject already added to this class");
        }

        ClassSubject classSubject = new ClassSubject();
        classSubject.setClassId(classId);
        classSubject.setSubjectId(request.getSubjectId());
        classSubject.setCreatedBy(tenantContext.getCurrentUserId());

        classSubjectRepository.save(classSubject);
        log.info("Subject {} added to class {}", request.getSubjectId(), classId);

        return mapToResponseDTO(classEntity);
    }

    @Override
    @Transactional
    public void assignTeacher(TeacherAssignRequest request) {
        classSubjectRepository
                .findByClassSubjectIdAndIsDeletedFalse(request.getClassSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Class-Subject mapping not found"));

        if (teacherAssignmentRepository.existsByClassSubjectIdAndTeacherUserIdAndIsActiveTrueAndIsDeletedFalse(
                request.getClassSubjectId(), request.getTeacherUserId())) {
            throw new DuplicateResourceException("Teacher already assigned to this class-subject");
        }

        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setClassSubjectId(request.getClassSubjectId());
        assignment.setTeacherUserId(request.getTeacherUserId());
        assignment.setIsActive(true);
        assignment.setCreatedBy(tenantContext.getCurrentUserId());

        teacherAssignmentRepository.save(assignment);
        log.info("Teacher {} assigned to class-subject {}",
                request.getTeacherUserId(), request.getClassSubjectId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSubjectResponseDTO> getClassSubjects(Integer classId) {
        classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass not found: " + classId));

        return classSubjectRepository.findByClassIdAndIsDeletedFalse(classId).stream()
                .map(cs -> {
                    Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(cs.getSubjectId())
                            .orElse(null);
                    ClassSubjectResponseDTO dto = new ClassSubjectResponseDTO();
                    dto.setClassSubjectId(cs.getClassSubjectId());
                    dto.setClassId(cs.getClassId());
                    dto.setSubjectId(cs.getSubjectId());
                    dto.setSubjectName(subject != null ? subject.getSubjectName() : null);
                    dto.setSubjectCode(subject != null ? subject.getSubjectCode() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherAssignmentResponseDTO> getTeacherAssignmentsByClass(Integer classId) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass not found: " + classId));

        List<ClassSubject> classSubjects = classSubjectRepository.findByClassIdAndIsDeletedFalse(classId);

        return classSubjects.stream()
                .flatMap(cs -> teacherAssignmentRepository.findActiveByClassSubjectId(cs.getClassSubjectId()).stream()
                        .map(ta -> {
                            Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(cs.getSubjectId())
                                    .orElse(null);
                            User teacher = userRepository.findById(ta.getTeacherUserId()).orElse(null);
                            TeacherAssignmentResponseDTO dto = new TeacherAssignmentResponseDTO();
                            dto.setAssignmentId(ta.getAssignmentId());
                            dto.setClassSubjectId(cs.getClassSubjectId());
                            dto.setClassName(classEntity.getClassName());
                            dto.setSubjectName(subject != null ? subject.getSubjectName() : null);
                            dto.setTeacherUserId(ta.getTeacherUserId());
                            dto.setTeacherName(teacher != null ? teacher.getFullName() : null);
                            dto.setIsActive(ta.getIsActive());
                            dto.setCreatedAt(ta.getCreatedAt());
                            return dto;
                        }))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClassResponseDTO getClassById(Integer classId) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass not found: " + classId));

        return mapToResponseDTO(classEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponseDTO> getAllClasses() {
        // This endpoint is open to SUPERADMIN, COLLEGEADMIN and HOD (see ClassController's
        // @PreAuthorize), so it can't assume every caller is an HOD. HOD is scoped to their own
        // department; SUPERADMIN/COLLEGEADMIN are scoped to their college, same as
        // DepartmentServiceImpl#getAllDepartments.
        List<AcademicClass> classes;
        if (tenantContext.getRoleId() != null && tenantContext.getRoleId() == 3) { // HOD role
            Integer hodUserId = tenantContext.getCurrentUserId();
            Department department = departmentRepository.findByDeptHeadUserIdAndIsDeletedFalse(hodUserId)
                    .orElseThrow(() -> new BadRequestException("You are not assigned as HOD"));
            classes = classRepository.findByDeptIdAndIsDeletedFalse(department.getDeptId());
        } else {
            classes = classRepository.findByCollegeIdAndIsDeletedFalse(tenantContext.getCollegeId());
        }

        return classes.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteClass(Integer classId) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass not found: " + classId));

        validateHODAccess(classEntity.getDeptId());

        classEntity.setIsDeleted(true);
        classEntity.setDeletedAt(LocalDateTime.now());
        classEntity.setDeletedBy(tenantContext.getCurrentUserId());

        classRepository.save(classEntity);
        log.info("AcademicClass soft deleted: {}", classId);
    }

    private void validateHODAccess(Integer deptId) {
        Integer hodUserId = tenantContext.getCurrentUserId();
        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        if (!hodUserId.equals(department.getDeptHeadUserId())) {
            throw new BadRequestException("You are not the HOD of this department");
        }
    }

    private ClassResponseDTO mapToResponseDTO(AcademicClass classEntity) {
        ClassResponseDTO dto = new ClassResponseDTO();
        dto.setClassId(classEntity.getClassId());
        dto.setDeptId(classEntity.getDeptId());
        dto.setCourseId(classEntity.getCourseId());
        dto.setAcademicYear(classEntity.getAcademicYear());
        dto.setSemester(classEntity.getSemester());
        dto.setSection(classEntity.getSection());
        dto.setClassName(classEntity.getClassName());
        dto.setCreatedAt(classEntity.getCreatedAt());
        return dto;
    }
}