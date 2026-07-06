// src/main/java/com/collegeManagement/dto/request/marks/MarkCreateRequest.java
package com.edgepoint.academic.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class MarkCreateRequest {
    @NotNull(message = "Assignment ID is required")
    private Integer assignmentId;

    @NotNull(message = "Exam type ID is required")
    private Integer examTypeId;

    @NotEmpty(message = "Student marks list cannot be empty")
    @Valid
    private List<StudentMarkDTO> studentMarks;
}