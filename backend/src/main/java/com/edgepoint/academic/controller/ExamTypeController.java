package com.edgepoint.academic.controller;

import com.edgepoint.academic.dto.ExamTypeCreateRequest;
import com.edgepoint.academic.dto.ExamTypeDTO;
import com.edgepoint.academic.service.ExamTypeService;
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
@RequestMapping("/exam-types")
@RequiredArgsConstructor
@Tag(name = "CollegeAdmin - Exam Types", description = "Exam type (Internal/External/...) configuration per college")
public class ExamTypeController {

    private final ExamTypeService examTypeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')")
    @Operation(summary = "Create exam type", description = "e.g. Internal, External, Mid-Semester")
    public ResponseEntity<ApiResponse<ExamTypeDTO>> createExamType(
            @Valid @RequestBody ExamTypeCreateRequest request) {
        log.info("Creating exam type: {}", request.getExamTypeName());

        ExamTypeDTO response = examTypeService.createExamType(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Exam type created successfully")
        );
    }

    // Broader than create: teachers/HODs need to read the list to pick an exam type when
    // entering marks, even though only SUPERADMIN/COLLEGEADMIN can define new ones.
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD', 'TEACHER')")
    @Operation(summary = "Get all exam types for the college")
    public ResponseEntity<ApiResponse<List<ExamTypeDTO>>> getExamTypes() {
        List<ExamTypeDTO> examTypes = examTypeService.getExamTypes();
        return ResponseEntity.ok(ApiResponse.success(examTypes, "Exam types retrieved successfully"));
    }
}
