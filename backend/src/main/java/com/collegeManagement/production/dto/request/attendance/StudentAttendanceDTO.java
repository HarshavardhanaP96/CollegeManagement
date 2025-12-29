// src/main/java/com/collegeManagement/dto/request/attendance/StudentAttendanceDTO.java
package com.collegeManagement.production.dto.request.attendance;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StudentAttendanceDTO {
    @NotNull(message = "Student user ID is required")
    private Integer studentUserId;

    @NotNull(message = "Present status is required")
    private Boolean isPresent;

    private String remarks;
}