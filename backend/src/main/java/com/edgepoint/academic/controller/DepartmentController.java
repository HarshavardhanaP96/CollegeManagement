// ============================================
// src/main/java/com/collegeManagement/controller/collegeadmin/DepartmentController.java
// ============================================

package com.edgepoint.academic.controller;

import com.edgepoint.academic.domain.Department;
import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.academic.dto.DepartmentCreateRequest;
import com.edgepoint.academic.dto.DepartmentUpdateRequest;
import com.edgepoint.academic.dto.AssignHODRequest;
import com.edgepoint.academic.dto.DepartmentResponseDTO;
import com.edgepoint.academic.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')")
@Tag(name = "CollegeAdmin - Departments", description = "Department management for CollegeAdmin")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @Operation(summary = "Create department", description = "Create a new department in the college")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> createDepartment(
            @Valid @RequestBody DepartmentCreateRequest request) {
        log.info("Creating department: {}", request.getDeptName());

        DepartmentResponseDTO response = departmentService.createDepartment(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Department created successfully")
        );
    }

    // HOD needs to read the department list too — e.g. StudentCreateRequest.deptId is a
    // required field the HOD picks when enrolling a student (see StudentCreatePage) — read-only,
    // so it doesn't need the class-level SUPERADMIN/COLLEGEADMIN restriction that
    // create/update/delete below still have. Same reasoning as CourseController's GET endpoints.
    @GetMapping
    @Operation(summary = "Get all departments", description = "Get all departments in the college")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD')")
    public ResponseEntity<ApiResponse<List<DepartmentResponseDTO>>> getAllDepartments() {
        log.info("Fetching all departments for college");

        List<DepartmentResponseDTO> departments = departmentService.getAllDepartments();

        return ResponseEntity.ok(
                ApiResponse.success(departments, "Departments retrieved successfully")
        );
    }

    @GetMapping("/{deptId}")
    @Operation(summary = "Get department by ID")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> getDepartmentById(
            @PathVariable Integer deptId) {
        log.info("Fetching department: {}", deptId);

        DepartmentResponseDTO response = departmentService.getDepartmentById(deptId);

        return ResponseEntity.ok(ApiResponse.success(response, "Department retrieved successfully"));
    }

    @PutMapping("/{deptId}")
    @Operation(summary = "Update department")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> updateDepartment(
            @PathVariable Integer deptId,
            @Valid @RequestBody DepartmentUpdateRequest request) {
        log.info("Updating department: {}", deptId);

        DepartmentResponseDTO response = departmentService.updateDepartment(deptId, request);

        return ResponseEntity.ok(ApiResponse.success(response, "Department updated successfully"));
    }

    @PostMapping("/{deptId}/assign-hod")
    @Operation(summary = "Assign HOD to department")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> assignHOD(
            @PathVariable Integer deptId,
            @Valid @RequestBody AssignHODRequest request) {
        log.info("Assigning HOD to department: {}", deptId);

        DepartmentResponseDTO response = departmentService.assignHOD(deptId, request);

        return ResponseEntity.ok(ApiResponse.success(response, "HOD assigned successfully"));
    }

    @DeleteMapping("/{deptId}")
    @Operation(summary = "Delete department")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Integer deptId) {
        log.info("Deleting department: {}", deptId);

        departmentService.deleteDepartment(deptId);

        return ResponseEntity.ok(ApiResponse.success(null, "Department deleted successfully"));
    }
}