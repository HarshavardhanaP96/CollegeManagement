package com.edgepoint.academic.controller;

import com.edgepoint.academic.dto.EnrollmentCreateRequest;
import com.edgepoint.academic.dto.EnrollmentResponseDTO;
import com.edgepoint.academic.service.EnrollmentService;
import com.edgepoint.core.dto.ApiResponse;
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
@RequestMapping("/enrollments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD')")
@Tag(name = "HOD - Enrollments", description = "Enrolling students into classes")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    @Operation(summary = "Enroll a student in a class")
    public ResponseEntity<ApiResponse<EnrollmentResponseDTO>> enrollStudent(
            @Valid @RequestBody EnrollmentCreateRequest request) {
        log.info("Enrolling student {} in class {}", request.getStudentUserId(), request.getClassId());

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Student enrolled successfully")
        );
    }

    @GetMapping("/class/{classId}")
    @Operation(summary = "Get enrollments for a class")
    public ResponseEntity<ApiResponse<List<EnrollmentResponseDTO>>> getEnrollmentsByClass(
            @PathVariable Integer classId) {
        List<EnrollmentResponseDTO> enrollments = enrollmentService.getEnrollmentsByClass(classId);
        return ResponseEntity.ok(ApiResponse.success(enrollments, "Enrollments retrieved successfully"));
    }
}
