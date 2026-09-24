package com.edgepoint.academic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExamTypeCreateRequest {
    @NotBlank(message = "Exam type name is required")
    @Size(max = 50)
    private String examTypeName;

    @NotNull(message = "Maximum marks is required")
    @Min(value = 1, message = "Maximum marks must be at least 1")
    private Integer maxMarks;
}
