// src/main/java/com/collegeManagement/dto/request/marks/StudentMarkDTO.java
package com.edgepoint.academic.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StudentMarkDTO {
    @NotNull(message = "Student user ID is required")
    private Integer studentUserId;

    @NotNull(message = "Marks obtained is required")
    @DecimalMin(value = "0.0", message = "Marks cannot be negative")
    private BigDecimal marksObtained;

    private String remarks;
}