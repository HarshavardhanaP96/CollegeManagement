// src/main/java/com/collegeManagement/service/department/DepartmentServiceImpl.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.AssignHODRequest;
import com.edgepoint.academic.dto.DepartmentCreateRequest;
import com.edgepoint.academic.dto.DepartmentUpdateRequest;
import com.edgepoint.academic.dto.DepartmentResponseDTO;
import com.edgepoint.academic.domain.Department;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.academic.repository.DepartmentRepository;
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
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public DepartmentResponseDTO createDepartment(DepartmentCreateRequest request) {
        Integer collegeId = tenantContext.getCollegeId();

        if (departmentRepository.existsByDeptCodeAndCollegeIdAndIsDeletedFalse(
                request.getDeptCode(), collegeId)) {
            throw new DuplicateResourceException("Department code already exists: " + request.getDeptCode());
        }

        Department department = new Department();
        department.setCollegeId(collegeId);
        department.setDeptName(request.getDeptName());
        department.setDeptCode(request.getDeptCode());
        department.setCreatedBy(tenantContext.getCurrentUserId());

        Department saved = departmentRepository.save(department);
        log.info("Department created: {} (ID: {})", saved.getDeptName(), saved.getDeptId());

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public DepartmentResponseDTO updateDepartment(Integer deptId, DepartmentUpdateRequest request) {
        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + deptId));

        validateTenantAccess(department.getCollegeId());

        if (request.getDeptName() != null) {
            department.setDeptName(request.getDeptName());
        }
        department.setUpdatedBy(tenantContext.getCurrentUserId());

        Department updated = departmentRepository.save(department);
        log.info("Department updated: {}", deptId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponseDTO getDepartmentById(Integer deptId) {
        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + deptId));

        validateTenantAccess(department.getCollegeId());

        return mapToResponseDTO(department);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> getAllDepartments() {
        Integer collegeId = tenantContext.getCollegeId();

        return departmentRepository.findByCollegeIdAndIsDeletedFalse(collegeId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepartmentResponseDTO assignHOD(Integer deptId, AssignHODRequest request) {
        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + deptId));

        validateTenantAccess(department.getCollegeId());

        User hod = userRepository.findById(request.getHodUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getHodUserId()));

        if (hod.getRoleId() != 3) { // HOD role
            throw new BadRequestException("User must have HOD role");
        }

        if (!hod.getCollegeId().equals(department.getCollegeId())) {
            throw new BadRequestException("HOD must belong to the same college");
        }

        department.setDeptHeadUserId(request.getHodUserId());
        department.setUpdatedBy(tenantContext.getCurrentUserId());

        Department updated = departmentRepository.save(department);
        log.info("HOD assigned to department: {}", deptId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional
    public void deleteDepartment(Integer deptId) {
        Department department = departmentRepository.findByDeptIdAndIsDeletedFalse(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + deptId));

        validateTenantAccess(department.getCollegeId());

        department.setIsDeleted(true);
        department.setDeletedAt(LocalDateTime.now());
        department.setDeletedBy(tenantContext.getCurrentUserId());

        departmentRepository.save(department);
        log.info("Department soft deleted: {}", deptId);
    }

    private void validateTenantAccess(Integer resourceCollegeId) {
        Integer currentCollegeId = tenantContext.getCollegeId();
        Integer currentRoleId = tenantContext.getRoleId();

        if (currentRoleId == 1) return; // SuperAdmin bypass

        if (!currentCollegeId.equals(resourceCollegeId)) {
            throw new BadRequestException("Access denied to this department");
        }
    }

    private DepartmentResponseDTO mapToResponseDTO(Department department) {
        DepartmentResponseDTO dto = new DepartmentResponseDTO();
        dto.setDeptId(department.getDeptId());
        dto.setCollegeId(department.getCollegeId());
        dto.setDeptName(department.getDeptName());
        dto.setDeptCode(department.getDeptCode());
        dto.setDeptHeadUserId(department.getDeptHeadUserId());

        if (department.getDeptHead() != null) {
            dto.setDeptHeadName(department.getDeptHead().getFullName());
        }

        dto.setCreatedAt(department.getCreatedAt());
        return dto;
    }
}