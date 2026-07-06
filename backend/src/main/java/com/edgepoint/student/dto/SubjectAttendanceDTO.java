// src/main/java/com/collegeManagement/dto/response/student/SubjectAttendanceDTO.java
package com.edgepoint.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectAttendanceDTO {
    private Integer subjectId;
    private String subjectName;
    private Integer totalClasses;
    private Integer presentCount;
    private Integer absentCount;
    private Double attendancePercentage;
}