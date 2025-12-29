// src/main/java/com/collegeManagement/dto/request/attendance/AttendanceCreateRequest.java
package com.collegeManagement.production.dto.request.attendance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceCreateRequest {
    @NotNull(message = "Assignment ID is required")
    private Integer assignmentId;

    @NotNull(message = "Record date is required")
    private LocalDate recordDate;

    @NotEmpty(message = "Student attendances list cannot be empty")
    @Valid
    private List<StudentAttendanceDTO> studentAttendances;
}