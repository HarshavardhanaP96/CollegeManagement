// src/main/java/com/collegeManagement/dto/response/attendance/AttendanceResponseDTO.java
package com.collegeManagement.production.dto.response.attendance;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AttendanceResponseDTO {
    private Integer attendanceId;
    private Integer assignmentId;
    private Integer studentUserId;
    private String studentName;
    private LocalDate recordDate;
    private Boolean isPresent;
    private String remarks;
    private LocalDateTime createdAt;
}