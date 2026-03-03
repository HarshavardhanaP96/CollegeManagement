// ============================================
// src/main/java/com/collegeManagement/controller/student/StudentAttendanceController.java
// ============================================

package com.collegeManagement.production.controller.student;

import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.student.StudentAttendanceDTO;
import com.collegeManagement.production.dto.response.student.SubjectAttendanceDTO;
import com.collegeManagement.production.service.student.StudentAttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/student-attendance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'STUDENT')")
@Tag(name = "Student - Attendance", description = "Attendance viewing for students")
public class StudentAttendanceController {

    private final StudentAttendanceService studentAttendanceService;

    @GetMapping("/my-attendance")
    @Operation(summary = "Get my attendance", description = "Get attendance for the logged-in student")
    public ResponseEntity<ApiResponse<StudentAttendanceDTO>> getMyAttendance(
            @RequestParam(required = false) Integer semester) {

        log.info("Student requesting attendance for semester: {}", semester);

        StudentAttendanceDTO attendance = studentAttendanceService.getMyAttendance(semester);

        return ResponseEntity.ok(
                ApiResponse.success(attendance, "Attendance retrieved successfully")
        );
    }

    @GetMapping("/subject/{subjectId}")
    @Operation(summary = "Get attendance for specific subject")
    public ResponseEntity<ApiResponse<SubjectAttendanceDTO>> getAttendanceBySubject(
            @PathVariable Integer subjectId) {

        SubjectAttendanceDTO attendance = studentAttendanceService.getAttendanceBySubject(subjectId);

        return ResponseEntity.ok(ApiResponse.success(attendance, "Subject attendance retrieved successfully"));
    }
}
