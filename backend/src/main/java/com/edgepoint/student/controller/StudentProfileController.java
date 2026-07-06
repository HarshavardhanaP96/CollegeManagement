// ============================================
// src/main/java/com/collegeManagement/controller/student/StudentProfileController.java
// ============================================

package com.edgepoint.student.controller;

import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.student.dto.StudentProfileUpdateRequest;
import com.edgepoint.student.dto.StudentProfileDTO;
import com.edgepoint.student.service.StudentProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'STUDENT')")
@Tag(name = "Student - Profile", description = "Profile management for students")
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    @GetMapping
    @Operation(summary = "Get my profile", description = "Get profile for the logged-in student")
    public ResponseEntity<ApiResponse<StudentProfileDTO>> getMyProfile() {
        log.info("Student requesting profile");

        StudentProfileDTO profile = studentProfileService.getMyProfile();

        return ResponseEntity.ok(
                ApiResponse.success(profile, "Profile retrieved successfully")
        );
    }

    @PutMapping
    @Operation(summary = "Update my profile", description = "Update profile for the logged-in student")
    public ResponseEntity<ApiResponse<StudentProfileDTO>> updateMyProfile(
            @Valid @RequestBody StudentProfileUpdateRequest request) {

        log.info("Student updating profile");

        StudentProfileDTO profile = studentProfileService.updateMyProfile(request);

        return ResponseEntity.ok(
                ApiResponse.success(profile, "Profile updated successfully")
        );
    }
}