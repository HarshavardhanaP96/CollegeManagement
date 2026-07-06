// src/main/java/com/collegeManagement/dto/request/course/CourseUpdateRequest.java
package com.edgepoint.academic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseUpdateRequest {
    @Size(max = 100)
    private String courseName;

    @Min(value = 1)
    private Integer durationYears;

    @Min(value = 2)
    private Integer totalSemesters;
}