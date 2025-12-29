// src/main/java/com/collegeManagement/service/classmanagement/ClassManagementServiceImpl.java
package com.collegeManagement.production.service.classmanagement;

import com.collegeManagement.production.dto.request.classmanagement.AddSubjectToClassRequest;
import com.collegeManagement.production.dto.request.classmanagement.ClassCreateRequest;
import com.collegeManagement.production.dto.request.classmanagement.TeacherAssignRequest;
import com.collegeManagement.production.dto.response.classmanagement.ClassResponseDTO;
import com.collegeManagement.production.entity.Class;
import com.collegeManagement.production.entity.ClassSubject;
import com.collegeManagement.production.entity.TeacherAssignment;

import com.collegeManagement.production.entity.Department;
import com.collegeManagement.production.exception.BadRequestException;
import com.collegeManagement.production.exception.DuplicateResourceException;
import com.collegeManagement.production.exception.ResourceNotFoundException;
import com.collegeManagement.production.repository.*;
import com.collegeManagement.production.security.TenantContext;
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

        Class classEntity = new Class();
        classEntity.setDeptId(department.getDeptId());
        classEntity.setCourseId(request.getCourseId());
        classEntity.setAcademicYear(request.getAcademicYear());
        classEntity.setSemester(request.getSemester());
        classEntity.setSection(request.getSection());
        classEntity.setClassName(request.getClassName());
        classEntity.setCreatedBy(hodUserId);

        Class saved = classRepository.save(classEntity);
        log.info("Class created: {} (ID: {})", saved.getClassName(), saved.getClassId());

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public ClassResponseDTO addSubjectToClass(Integer classId, AddSubjectToClassRequest request) {
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

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
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

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
        Class classEntity = classRepository.findByClassIdAndIsDeletedFalse(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        validateHODAccess(classEntity.getDeptId());

        classEntity.setIsDeleted(true);
        classEntity.setDeletedAt(LocalDateTime.now());
        classEntity.setDeletedBy(tenantContext.getCurrentUserId());

        classRepository.save(classEntity);
        log.info("Class soft deleted: {}", classId);
    }

    private void validateHODAccess(Integer deptId) {
        Integer hodUserId = tenantContext.getCurrentUserId();
        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        if (!hodUserId.equals(department.getDeptHeadUserId())) {
            throw new BadRequestException("You are not the HOD of this department");
        }
    }

    private ClassResponseDTO mapToResponseDTO(Class classEntity) {
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