// src/main/java/com/collegeManagement/dto/request/classmanagement/ClassCreateRequest.java
package com.collegeManagement.production.dto.request.classmanagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClassCreateRequest {
    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotBlank(message = "Academic year is required")
    @Size(max = 20)
    private String academicYear; // e.g., "2024-2025"

    @NotNull(message = "Semester is required")
    private Integer semester;

    @Size(max = 10)
    private String section; // A, B, C, etc.

    @NotBlank(message = "Class name is required")
    @Size(max = 100)
    private String className; // e.g., "CSE 3rd Year - Section A"
}