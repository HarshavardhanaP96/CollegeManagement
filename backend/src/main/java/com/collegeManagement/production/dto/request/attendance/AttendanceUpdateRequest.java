// src/main/java/com/collegeManagement/dto/request/attendance/AttendanceUpdateRequest.java
package com.collegeManagement.production.dto.request.attendance;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceUpdateRequest {
    @NotNull(message = "Present status is required")
    private Boolean isPresent;

    private String remarks;
}