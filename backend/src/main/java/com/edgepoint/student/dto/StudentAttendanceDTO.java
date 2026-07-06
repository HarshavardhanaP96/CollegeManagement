// src/main/java/com/collegeManagement/dto/response/student/StudentAttendanceDTO.java
package com.edgepoint.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceDTO {
    private Integer studentUserId;
    private String studentName;
    private String rollNumber;
    private Integer semester;
    private List<SubjectAttendanceDTO> subjectAttendances;
    private Double overallAttendance;
}