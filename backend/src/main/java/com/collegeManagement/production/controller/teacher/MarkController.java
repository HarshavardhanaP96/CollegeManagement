package com.collegeManagement.production.controller.teacher;

import com.collegeManagement.production.dto.request.mark.MarkCreateRequest;
import com.collegeManagement.production.dto.request.mark.MarkUpdateRequest;
import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.mark.ExamTypeDTO;
import com.collegeManagement.production.dto.response.mark.MarkResponseDTO;
import com.collegeManagement.production.dto.response.mark.MarkSummaryDTO;
import com.collegeManagement.production.service.mark.MarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@RequestMapping("/teachers/marks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
@Tag(name = "Teacher - Mark", description = "Mark management for teachers")
public class MarkController {

    private final MarkService markService;

    @PostMapping
    @Operation(summary = "Enter marks", description = "Enter marks for students in an exam")
    public ResponseEntity<ApiResponse<MarkSummaryDTO>> enterMarks(
            @Valid @RequestBody MarkCreateRequest request) {
        log.info("Teacher entering marks for assignment: {}, exam: {}",
                request.getAssignmentId(), request.getExamTypeId());

        MarkSummaryDTO summary = markService.enterMarks(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(summary, "Marks entered successfully")
        );
    }

    @GetMapping("/assignment/{assignmentId}")
    @Operation(summary = "Get marks by assignment")
    public ResponseEntity<ApiResponse<List<MarkResponseDTO>>> getMarksByAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Integer assignmentId,
            @Parameter(description = "Exam type ID (optional)") @RequestParam(required = false) Integer examTypeId) {

        log.info("Fetching marks for assignment: {}", assignmentId);

        List<MarkResponseDTO> marks = markService.getMarksByAssignment(assignmentId, examTypeId);

        return ResponseEntity.ok(
                ApiResponse.success(marks, "Marks retrieved successfully")
        );
    }

    @GetMapping("/assignment/{assignmentId}/summary")
    @Operation(summary = "Get marks summary")
    public ResponseEntity<ApiResponse<MarkSummaryDTO>> getMarkSummary(
            @PathVariable Integer assignmentId,
            @RequestParam(required = false) Integer examTypeId) {

        MarkSummaryDTO summary = markService.getMarksSummary(assignmentId, examTypeId);

        return ResponseEntity.ok(ApiResponse.success(summary, "Summary retrieved successfully"));
    }

    @PutMapping("/{markId}")
    @Operation(summary = "Update marks")
    public ResponseEntity<ApiResponse<MarkResponseDTO>> updateMarks(
            @PathVariable Integer markId,
            @Valid @RequestBody MarkUpdateRequest request) {

        log.info("Updating mark: {}", markId);

        MarkResponseDTO response = markService.updateMarks(markId, request);

        return ResponseEntity.ok(ApiResponse.success(response, "Mark updated successfully"));
    }

    @GetMapping("/exam-types")
    @Operation(summary = "Get exam types", description = "Get all exam types for the college")
    public ResponseEntity<ApiResponse<List<ExamTypeDTO>>> getExamTypes() {
        List<ExamTypeDTO> examTypes = markService.getExamTypes();
        return ResponseEntity.ok(ApiResponse.success(examTypes, "Exam types retrieved successfully"));
    }
}