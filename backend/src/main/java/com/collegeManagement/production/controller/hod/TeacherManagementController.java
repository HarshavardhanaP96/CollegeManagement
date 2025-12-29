// ============================================
// src/main/java/com/collegeManagement/controller/hod/TeacherManagementController.java
// ============================================

package com.collegeManagement.production.controller.hod;

import lombok.extern.slf4j.Slf4j;



@Slf4j
// TODO: TeacherManagementService needs to be created
/*
@RestController
@RequestMapping("/hod/teachers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HOD')")
@Tag(name = "HOD - Teachers", description = "Teacher management for HOD")
public class TeacherManagementController {

    private final TeacherManagementService teacherManagementService;

    @PostMapping
    @Operation(summary = "Create teacher")
    public ResponseEntity<ApiResponse<TeacherResponseDTO>> createTeacher(
            @Valid @RequestBody TeacherCreateRequest request) {
        log.info("HOD creating teacher: {}", request.getFullName());

        TeacherResponseDTO response = teacherManagementService.createTeacher(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Teacher created successfully")
        );
    }

    @GetMapping
    @Operation(summary = "Get all teachers in department")
    public ResponseEntity<ApiResponse<List<TeacherResponseDTO>>> getAllTeachers() {
        List<TeacherResponseDTO> teachers = teacherManagementService.getAllTeachers();
        return ResponseEntity.ok(ApiResponse.success(teachers, "Teachers retrieved successfully"));
    }

    @GetMapping("/{teacherId}")
    @Operation(summary = "Get teacher by ID")
    public ResponseEntity<ApiResponse<TeacherResponseDTO>> getTeacherById(@PathVariable Integer teacherId) {
        TeacherResponseDTO response = teacherManagementService.getTeacherById(teacherId);
        return ResponseEntity.ok(ApiResponse.success(response, "Teacher retrieved successfully"));
    }

    @PutMapping("/{teacherId}")
    @Operation(summary = "Update teacher")
    public ResponseEntity<ApiResponse<TeacherResponseDTO>> updateTeacher(
            @PathVariable Integer teacherId,
            @Valid @RequestBody TeacherUpdateRequest request) {
        TeacherResponseDTO response = teacherManagementService.updateTeacher(teacherId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Teacher updated successfully"));
    }

    @DeleteMapping("/{teacherId}")
    @Operation(summary = "Delete teacher")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Integer teacherId) {
        teacherManagementService.deleteTeacher(teacherId);
        return ResponseEntity.ok(ApiResponse.success(null, "Teacher deleted successfully"));
    }
}
*/

// Empty class to prevent compilation errors
public class TeacherManagementController {
}