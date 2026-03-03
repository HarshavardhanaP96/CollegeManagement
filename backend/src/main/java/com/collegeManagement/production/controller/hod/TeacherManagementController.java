package com.collegeManagement.production.controller.hod;

import com.collegeManagement.production.dto.request.teacher.TeacherCreateRequest;
import com.collegeManagement.production.dto.request.teacher.TeacherUpdateRequest;
import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.teacher.TeacherResponseDTO;
import com.collegeManagement.production.service.hod.TeacherManagementService;
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
@RequestMapping("/teachers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD')")
@Tag(name = "Faculty Management", description = "Endpoints for managing teacher accounts and profiles")
public class TeacherManagementController {

    private final TeacherManagementService teacherManagementService;

    @PostMapping
    @Operation(summary = "Onboard a new faculty member")
    public ResponseEntity<ApiResponse<TeacherResponseDTO>> createTeacher(
            @Valid @RequestBody TeacherCreateRequest request) {
        log.info("Creating new teacher account: {}", request.getFullName());

        TeacherResponseDTO response = teacherManagementService.createTeacher(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Teacher created successfully")
        );
    }

    @GetMapping
    @Operation(summary = "List all faculty members")
    public ResponseEntity<ApiResponse<List<TeacherResponseDTO>>> getAllTeachers() {
        List<TeacherResponseDTO> teachers = teacherManagementService.getAllTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers, "Teachers retrieved successfully"));
    }

    @GetMapping("/{teacherId}")
    @Operation(summary = "Get faculty details by user ID")
    public ResponseEntity<ApiResponse<TeacherResponseDTO>> getTeacherById(@PathVariable Integer teacherId) {
        TeacherResponseDTO response = teacherManagementService.getTeacherById(teacherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Teacher retrieved successfully"));
    }

    @PutMapping("/{teacherId}")
    @Operation(summary = "Update faculty profile")
    public ResponseEntity<ApiResponse<TeacherResponseDTO>> updateTeacher(
            @PathVariable Integer teacherId,
            @Valid @RequestBody TeacherUpdateRequest request) {
        TeacherResponseDTO response = teacherManagementService.updateTeacher(teacherId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Teacher updated successfully"));
    }

    @DeleteMapping("/{teacherId}")
    @Operation(summary = "Deactivate/Delete faculty account")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Integer teacherId) {
        teacherManagementService.deleteTeacher(teacherId);
        return ResponseEntity.ok(ApiResponse.success(null, "Teacher deleted successfully"));
    }
}