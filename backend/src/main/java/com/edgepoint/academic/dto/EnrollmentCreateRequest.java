package com.edgepoint.academic.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EnrollmentCreateRequest {
    @NotNull(message = "Student user ID is required")
    private Integer studentUserId;

    @NotNull(message = "Class ID is required")
    private Integer classId;
}
