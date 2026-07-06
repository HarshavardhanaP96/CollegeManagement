// src/main/java/com/collegeManagement/dto/request/course/CourseCreateRequest.java
package com.edgepoint.academic.dto;

import com.edgepoint.academic.domain.Course;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseCreateRequest {
    @NotBlank(message = "Course name is required")
    @Size(max = 100)
    private String courseName;

    @NotBlank(message = "Course code is required")
    @Size(max = 20)
    private String courseCode;

    @NotNull(message = "Duration in years is required")
    @Min(value = 1, message = "Duration must be at least 1 year")
    private Integer durationYears;

    @NotNull(message = "Total semesters is required")
    @Min(value = 2, message = "Total semesters must be at least 2")
    private Integer totalSemesters;
}