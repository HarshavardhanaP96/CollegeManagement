// src/main/java/com/collegeManagement/dto/response/attendance/AttendanceSummaryDTO.java
package com.collegeManagement.production.dto.response.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryDTO {
    private Integer assignmentId;
    private LocalDate recordDate;
    private Integer totalStudents;
    private Integer presentCount;
    private Integer absentCount;
    private Integer markedCount;
    private Integer unmarkedCount;
    private Double attendancePercentage;
}