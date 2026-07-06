// src/main/java/com/collegeManagement/service/classmanagement/ClassManagementServiceImpl.java
package com.edgepoint.academic.service;


import com.edgepoint.academic.domain.Subject;
import com.edgepoint.academic.repository.ClassRepository;
import com.edgepoint.academic.repository.ClassSubjectRepository;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;

import com.edgepoint.academic.dto.AddSubjectToClassRequest;
import com.edgepoint.academic.dto.ClassCreateRequest;
import com.edgepoint.academic.dto.TeacherAssignRequest;
import com.edgepoint.academic.dto.ClassResponseDTO;
import com.edgepoint.academic.domain.AcademicClass;
import com.edgepoint.academic.domain.ClassSubject;
import com.edgepoint.academic.domain.TeacherAssignment;

import com.edgepoint.academic.domain.Department;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
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
    public ClassResponseDTO getClassById(Integer classId) {
        AcademicClass classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass not found: " + classId));

        return mapToResponseDTO(classEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponseDTO> getAllClasses() {
        Integer hodUserId = tenantContext.getCurrentUserId();
        Department department = departmentRepository.findByDeptHeadUserIdAndIsDeletedFalse(hodUserId)
                .orElseThrow(() -> new BadRequestException("You are not assigned as HOD"));

        return classRepository.findByDeptIdAndIsDeletedFalse(department.getDeptId()).stream()
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