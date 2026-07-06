// ============================================
// src/main/java/com/collegeManagement/controller/collegeadmin/CourseController.java
// ============================================

package com.edgepoint.academic.controller;

import com.edgepoint.academic.domain.Course;
import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.academic.dto.CourseCreateRequest;
import com.edgepoint.academic.dto.CourseUpdateRequest;
import com.edgepoint.academic.dto.CourseResponseDTO;
import com.edgepoint.academic.service.CourseService;
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
@RequestMapping("/courses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')")
@Tag(name = "CollegeAdmin - Courses", description = "Course management for CollegeAdmin")
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @Operation(summary = "Create course")
    public ResponseEntity<ApiResponse<CourseResponseDTO>> createCourse(
            @Valid @RequestBody CourseCreateRequest request) {
        log.info("Creating course: {}", request.getCourseName());

        CourseResponseDTO response = courseService.createCourse(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Course created successfully")
        );
    }

    @GetMapping
    @Operation(summary = "Get all courses")
    public ResponseEntity<ApiResponse<List<CourseResponseDTO>>> getAllCourses() {
        List<CourseResponseDTO> courses = courseService.getAllCourses();
        return ResponseEntity.ok(ApiResponse.success(courses, "Courses retrieved successfully"));
    }

    @GetMapping("/{courseId}")
    @Operation(summary = "Get course by ID")
    public ResponseEntity<ApiResponse<CourseResponseDTO>> getCourseById(@PathVariable Integer courseId) {
        CourseResponseDTO response = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(response, "Course retrieved successfully"));
    }

    @PutMapping("/{courseId}")
    @Operation(summary = "Update course")
    public ResponseEntity<ApiResponse<CourseResponseDTO>> updateCourse(
            @PathVariable Integer courseId,
            @Valid @RequestBody CourseUpdateRequest request) {
        CourseResponseDTO response = courseService.updateCourse(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Course updated successfully"));
    }

    @DeleteMapping("/{courseId}")
    @Operation(summary = "Delete course")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Integer courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }
}