package com.edgepoint.teacher.controller;

import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.teacher.dto.TeacherDashboardDTO;
import com.edgepoint.teacher.service.TeacherDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'TEACHER')")
@Tag(name = "Teacher - Dashboard", description = "Teacher dashboard endpoints")
public class TeacherDashboardController {

    private final TeacherDashboardService teacherDashboardService;

    @GetMapping
    @Operation(summary = "Get teacher dashboard", description = "Get dashboard statistics and overview for logged-in teacher")
    public ResponseEntity<ApiResponse<TeacherDashboardDTO>> getDashboard() {
        TeacherDashboardDTO dashboard = teacherDashboardService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(dashboard, "Dashboard data retrieved successfully"));
    }
}