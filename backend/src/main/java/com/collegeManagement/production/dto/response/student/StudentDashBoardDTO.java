// src/main/java/com/collegeManagement/dto/response/student/StudentDashboardDTO.java
package com.collegeManagement.production.dto.response.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashBoardDTO {
    private String studentName;
    private String rollNumber;
    private String department;
    private String course;
    private Integer currentSemester;
    private Double overallAttendance;
    private Double overallPercentage;
    private Integer totalSubjects;
    private StudentAttendanceDTO recentAttendance;
    private StudentMarkDTO recentMarks;
}