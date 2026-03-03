// ============================================
// src/main/java/com/collegeManagement/controller/hod/SubjectController.java
// ============================================

package com.collegeManagement.production.controller.hod;

import com.collegeManagement.production.dto.request.subject.SubjectCreateRequest;
import com.collegeManagement.production.dto.request.subject.SubjectUpdateRequest;
import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.subject.SubjectResponseDTO;
import com.collegeManagement.production.service.subject.SubjectService;
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
@RequestMapping("/subjects")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD')")
@Tag(name = "HOD - Subjects", description = "Subject management for HOD")
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    @Operation(summary = "Create subject")
    public ResponseEntity<ApiResponse<SubjectResponseDTO>> createSubject(
            @Valid @RequestBody SubjectCreateRequest request) {
        log.info("HOD creating subject: {}", request.getSubjectName());

        SubjectResponseDTO response = subjectService.createSubject(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Subject created successfully")
        );
    }

    @GetMapping
    @Operation(summary = "Get all subjects in department")
    public ResponseEntity<ApiResponse<List<SubjectResponseDTO>>> getAllSubjects() {
        List<SubjectResponseDTO> subjects = subjectService.getAllSubjects();
        return ResponseEntity.ok(ApiResponse.success(subjects, "Subjects retrieved successfully"));
    }

    @GetMapping("/{subjectId}")
    @Operation(summary = "Get subject by ID")
    public ResponseEntity<ApiResponse<SubjectResponseDTO>> getSubjectById(@PathVariable Integer subjectId) {
        SubjectResponseDTO response = subjectService.getSubjectById(subjectId);
        return ResponseEntity.ok(ApiResponse.success(response, "Subject retrieved successfully"));
    }

    @PutMapping("/{subjectId}")
    @Operation(summary = "Update subject")
    public ResponseEntity<ApiResponse<SubjectResponseDTO>> updateSubject(
            @PathVariable Integer subjectId,
            @Valid @RequestBody SubjectUpdateRequest request) {
        SubjectResponseDTO response = subjectService.updateSubject(subjectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Subject updated successfully"));
    }

    @DeleteMapping("/{subjectId}")
    @Operation(summary = "Delete subject")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable Integer subjectId) {
        subjectService.deleteSubject(subjectId);
        return ResponseEntity.ok(ApiResponse.success(null, "Subject deleted successfully"));
    }
}