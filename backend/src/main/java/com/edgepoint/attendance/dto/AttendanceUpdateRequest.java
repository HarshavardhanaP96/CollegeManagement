// src/main/java/com/collegeManagement/dto/request/attendance/AttendanceUpdateRequest.java
package com.edgepoint.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceUpdateRequest {
    @NotNull(message = "Present status is required")
    private Boolean isPresent;

    private String remarks;
}