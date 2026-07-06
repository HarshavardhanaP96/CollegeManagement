package com.edgepoint.student.controller;

import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.student.dto.StudentCreateRequest;
import com.edgepoint.student.dto.StudentUpdateRequest;
import com.edgepoint.student.dto.StudentResponseDTO;
import com.edgepoint.student.service.StudentManagementService;
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
@RequestMapping("/students")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN', 'HOD')")
@Tag(name = "Student Management", description = "Endpoints for administrative student account and enrollment management")
public class StudentManagementController {

    private final StudentManagementService studentManagementService;

    @PostMapping
    @Operation(summary = "Enroll a new student")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> createStudent(
            @Valid @RequestBody StudentCreateRequest request) {
        log.info("Enrolling new student: {}", request.getFullName());

        StudentResponseDTO response = studentManagementService.createStudent(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Student enrolled successfully")
        );
    }

    @GetMapping
    @Operation(summary = "List all students in the institution")
    public ResponseEntity<ApiResponse<List<StudentResponseDTO>>> getAllStudents() {
        List<StudentResponseDTO> students = studentManagementService.getAllStudents();
        return ResponseEntity.ok(ApiResponse.success(students, "Students retrieved successfully"));
    }

    @GetMapping("/{studentId}")
    @Operation(summary = "Get student details by user ID")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> getStudentById(@PathVariable Integer studentId) {
        StudentResponseDTO response = studentManagementService.getStudentById(studentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Student retrieved successfully"));
    }

    @PutMapping("/{studentId}")
    @Operation(summary = "Update student enrollment or record")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> updateStudent(
            @PathVariable Integer studentId,
            @Valid @RequestBody StudentUpdateRequest request) {
        StudentResponseDTO response = studentManagementService.updateStudent(studentId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Student updated successfully"));
    }

    @DeleteMapping("/{studentId}")
    @Operation(summary = "Deactivate/Delete student account")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Integer studentId) {
        studentManagementService.deleteStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Student deleted successfully"));
    }
}
