package com.edgepoint.academic.service;

import com.edgepoint.academic.domain.Department;
import com.edgepoint.academic.domain.Subject;
import com.edgepoint.academic.dto.SubjectCreateRequest;
import com.edgepoint.academic.dto.SubjectResponseDTO;
import com.edgepoint.academic.dto.SubjectUpdateRequest;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.academic.repository.SubjectRepository;
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
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public SubjectResponseDTO createSubject(SubjectCreateRequest request) {
        Department department = hodDepartment();

        if (subjectRepository.existsBySubjectCodeAndDeptIdAndIsDeletedFalse(
                request.getSubjectCode(), department.getDeptId())) {
            throw new DuplicateResourceException("Subject code already exists: " + request.getSubjectCode());
        }

        Subject subject = new Subject();
        subject.setDeptId(department.getDeptId());
        subject.setSubjectName(request.getSubjectName());
        subject.setSubjectCode(request.getSubjectCode());
        subject.setCredits(request.getCredits());
        subject.setSubjectType(request.getSubjectType());
        subject.setCreatedBy(tenantContext.getCurrentUserId());

        Subject saved = subjectRepository.save(subject);
        log.info("Subject created: {} (ID: {})", saved.getSubjectName(), saved.getSubjectId());

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public SubjectResponseDTO updateSubject(Integer subjectId, SubjectUpdateRequest request) {
        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        validateAccess(subject.getDeptId());

        if (request.getSubjectName() != null) {
            subject.setSubjectName(request.getSubjectName());
        }
        if (request.getCredits() != null) {
            subject.setCredits(request.getCredits());
        }
        if (request.getSubjectType() != null) {
            subject.setSubjectType(request.getSubjectType());
        }
        subject.setUpdatedBy(tenantContext.getCurrentUserId());

        Subject updated = subjectRepository.save(subject);
        log.info("Subject updated: {}", subjectId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponseDTO getSubjectById(Integer subjectId) {
        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        validateAccess(subject.getDeptId());

        return mapToResponseDTO(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponseDTO> getAllSubjects() {
        // SUPERADMIN/COLLEGEADMIN see every subject in their college; HOD is scoped to their own
        // department — same split as ClassManagementServiceImpl#getAllClasses.
        List<Subject> subjects;
        if (tenantContext.getRoleId() != null && tenantContext.getRoleId() == 3) { // HOD role
            subjects = subjectRepository.findByDeptIdAndIsDeletedFalse(hodDepartment().getDeptId());
        } else {
            subjects = subjectRepository.findByCollegeIdAndIsDeletedFalse(tenantContext.getCollegeId());
        }

        return subjects.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSubject(Integer subjectId) {
        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        validateAccess(subject.getDeptId());

        subject.setIsDeleted(true);
        subject.setDeletedAt(LocalDateTime.now());
        subject.setDeletedBy(tenantContext.getCurrentUserId());

        subjectRepository.save(subject);
        log.info("Subject soft deleted: {}", subjectId);
    }

    private Department hodDepartment() {
        Integer hodUserId = tenantContext.getCurrentUserId();
        return departmentRepository.findByDeptHeadUserIdAndIsDeletedFalse(hodUserId)
                .orElseThrow(() -> new BadRequestException("You are not assigned as HOD of any department"));
    }

    /** SUPERADMIN may access any subject; everyone else must belong to the subject's own college. */
    private void validateAccess(Integer subjectDeptId) {
        Integer currentRoleId = tenantContext.getRoleId();
        if (currentRoleId != null && currentRoleId == 1) return;

        Department department = departmentRepository.findById(subjectDeptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + subjectDeptId));

        if (!department.getCollegeId().equals(tenantContext.getCollegeId())) {
            throw new BadRequestException("Access denied to this subject");
        }
    }

    private SubjectResponseDTO mapToResponseDTO(Subject subject) {
        SubjectResponseDTO dto = new SubjectResponseDTO();
        dto.setSubjectId(subject.getSubjectId());
        dto.setDeptId(subject.getDeptId());
        dto.setSubjectName(subject.getSubjectName());
        dto.setSubjectCode(subject.getSubjectCode());
        dto.setCredits(subject.getCredits());
        dto.setSubjectType(subject.getSubjectType());
        dto.setCreatedAt(subject.getCreatedAt());
        return dto;
    }
}
