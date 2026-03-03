// ============================================
// src/main/java/com/collegeManagement/controller/student/StudentDashboardController.java
// ============================================

package com.collegeManagement.production.controller.student;

import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.student.StudentDashBoardDTO;
import com.collegeManagement.production.service.student.StudentDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard/student")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'STUDENT')")
@Tag(name = "Student - Dashboard", description = "Student dashboard")
public class StudentDashboardController {

    private final StudentDashboardService studentDashboardService;

    @GetMapping
    @Operation(summary = "Get student dashboard", description = "Get dashboard data for logged-in student")
    public ResponseEntity<ApiResponse<StudentDashBoardDTO>> getDashboard() {
        StudentDashBoardDTO dashboard = studentDashboardService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(dashboard, "Dashboard data retrieved successfully"));
    }
}