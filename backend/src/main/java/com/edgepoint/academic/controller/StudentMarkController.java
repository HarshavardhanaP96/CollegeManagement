package com.edgepoint.academic.controller;

import com.edgepoint.academic.domain.Mark;
import com.edgepoint.academic.domain.Subject;
import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.student.dto.StudentMarkDTO;
import com.edgepoint.student.dto.SubjectMarkDTO;
import com.edgepoint.academic.service.StudentMarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/student-marks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'STUDENT')")
@Tag(name = "Student - Mark", description = "Mark viewing for students")
public class StudentMarkController {

    private final StudentMarkService studentMarkService;

    @GetMapping("/my-marks")
    @Operation(summary = "Get my marks", description = "Get marks for the logged-in student")
    public ResponseEntity<ApiResponse<StudentMarkDTO>> getMyMarks(
            @Parameter(description = "Semester (optional, defaults to current semester)")
            @RequestParam(required = false) Integer semester) {

        log.info("Student requesting marks for semester: {}", semester);

        StudentMarkDTO marks = studentMarkService.getMyMarks(semester);

        return ResponseEntity.ok(
                ApiResponse.success(marks, "Mark retrieved successfully")
        );
    }

    @GetMapping("/subject/{subjectId}")
    @Operation(summary = "Get marks for specific subject")
    public ResponseEntity<ApiResponse<SubjectMarkDTO>> getMarksBySubject(
            @PathVariable Integer subjectId) {

        SubjectMarkDTO marks = studentMarkService.getMarksBySubject(subjectId);

        return ResponseEntity.ok(ApiResponse.success(marks, "Subject mark retrieved successfully"));
    }
}