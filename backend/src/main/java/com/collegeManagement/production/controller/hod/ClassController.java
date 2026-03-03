// ============================================
// src/main/java/com/collegeManagement/controller/hod/ClassController.java
// ============================================

package com.collegeManagement.production.controller.hod;

import com.collegeManagement.production.dto.request.classmanagement.ClassCreateRequest;
import com.collegeManagement.production.dto.request.classmanagement.AddSubjectToClassRequest;
import com.collegeManagement.production.dto.request.classmanagement.TeacherAssignRequest;
import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.classmanagement.ClassResponseDTO;
import com.collegeManagement.production.service.classmanagement.ClassManagementService;
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
@RequestMapping("/classes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD')")
@Tag(name = "HOD - Classes", description = "Class management for HOD")
public class ClassController {

    private final ClassManagementService classManagementService;

    @PostMapping
    @Operation(summary = "Create class")
    public ResponseEntity<ApiResponse<ClassResponseDTO>> createClass(
            @Valid @RequestBody ClassCreateRequest request) {
        log.info("HOD creating class: {}", request.getClassName());

        ClassResponseDTO response = classManagementService.createClass(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Class created successfully")
        );
    }

    @GetMapping
    @Operation(summary = "Get all classes in department")
    public ResponseEntity<ApiResponse<List<ClassResponseDTO>>> getAllClasses() {
        List<ClassResponseDTO> classes = classManagementService.getAllClasses();
        return ResponseEntity.ok(ApiResponse.success(classes, "Classes retrieved successfully"));
    }

    @GetMapping("/{classId}")
    @Operation(summary = "Get class by ID")
    public ResponseEntity<ApiResponse<ClassResponseDTO>> getClassById(@PathVariable Integer classId) {
        ClassResponseDTO response = classManagementService.getClassById(classId);
        return ResponseEntity.ok(ApiResponse.success(response, "Class retrieved successfully"));
    }

    @PostMapping("/{classId}/subjects")
    @Operation(summary = "Add subject to class")
    public ResponseEntity<ApiResponse<ClassResponseDTO>> addSubjectToClass(
            @PathVariable Integer classId,
            @Valid @RequestBody AddSubjectToClassRequest request) {
        ClassResponseDTO response = classManagementService.addSubjectToClass(classId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Subject added to class successfully"));
    }

    @PostMapping("/teacher-assignments")
    @Operation(summary = "Assign teacher to class-subject")
    public ResponseEntity<ApiResponse<Void>> assignTeacher(
            @Valid @RequestBody TeacherAssignRequest request) {
        classManagementService.assignTeacher(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Teacher assigned successfully"));
    }

    @DeleteMapping("/{classId}")
    @Operation(summary = "Delete class")
    public ResponseEntity<ApiResponse<Void>> deleteClass(@PathVariable Integer classId) {
        classManagementService.deleteClass(classId);
        return ResponseEntity.ok(ApiResponse.success(null, "Class deleted successfully"));
    }
}