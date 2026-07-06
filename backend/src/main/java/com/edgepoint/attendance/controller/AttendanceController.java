// ============================================
// src/main/java/com/collegeManagement/controller/teacher/AttendanceController.java
// ============================================

package com.edgepoint.attendance.controller;

import com.edgepoint.academic.domain.Mark;
import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.attendance.dto.AttendanceCreateRequest;
import com.edgepoint.attendance.dto.AttendanceUpdateRequest;
import com.edgepoint.attendance.dto.AttendanceResponseDTO;
import com.edgepoint.attendance.dto.AttendanceSummaryDTO;
import com.edgepoint.teacher.dto.TeacherAssignmentDTO;
import com.edgepoint.attendance.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'TEACHER')")
@Tag(name = "Teacher - Attendance", description = "Attendance management for teachers")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    @Operation(summary = "Mark attendance", description = "Mark attendance for students in a class")
    public ResponseEntity<ApiResponse<AttendanceSummaryDTO>> markAttendance(
            @Valid @RequestBody AttendanceCreateRequest request) {
        log.info("Teacher marking attendance for assignment: {} on date: {}",
                request.getAssignmentId(), request.getRecordDate());

        AttendanceSummaryDTO summary = attendanceService.markAttendance(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(summary, "Attendance marked successfully")
        );
    }

    @GetMapping("/assignment/{assignmentId}")
    @Operation(summary = "Get attendance by assignment", description = "Get attendance records for a specific assignment")
    public ResponseEntity<ApiResponse<List<AttendanceResponseDTO>>> getAttendanceByAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Integer assignmentId,
            @Parameter(description = "Start date") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("Fetching attendance for assignment: {}", assignmentId);

        List<AttendanceResponseDTO> attendance = attendanceService.getAttendanceByAssignment(
                assignmentId, startDate, endDate);

        return ResponseEntity.ok(
                ApiResponse.success(attendance, "Attendance records retrieved successfully")
        );
    }

    @GetMapping("/assignment/{assignmentId}/summary")
    @Operation(summary = "Get attendance summary", description = "Get attendance summary for an assignment")
    public ResponseEntity<ApiResponse<AttendanceSummaryDTO>> getAttendanceSummary(
            @PathVariable Integer assignmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        AttendanceSummaryDTO summary = attendanceService.getAttendanceSummary(
                assignmentId, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success(summary, "Summary retrieved successfully"));
    }

    @PutMapping("/{attendanceId}")
    @Operation(summary = "Update attendance record")
    public ResponseEntity<ApiResponse<AttendanceResponseDTO>> updateAttendance(
            @PathVariable Integer attendanceId,
            @Valid @RequestBody AttendanceUpdateRequest request) {

        log.info("Updating attendance record: {}", attendanceId);

        AttendanceResponseDTO response = attendanceService.updateAttendance(attendanceId, request);

        return ResponseEntity.ok(ApiResponse.success(response, "Attendance updated successfully"));
    }

    @GetMapping("/my-assignments")
    @Operation(summary = "Get teacher's assignments", description = "Get all class-subject assignments for the logged-in teacher")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentDTO>>> getMyAssignments() {
        List<TeacherAssignmentDTO> assignments = attendanceService.getTeacherAssignments();
        return ResponseEntity.ok(ApiResponse.success(assignments, "Assignments retrieved successfully"));
    }
}