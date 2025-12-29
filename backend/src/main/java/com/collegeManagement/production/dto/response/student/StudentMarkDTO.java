// src/main/java/com/collegeManagement/dto/response/student/StudentMarksDTO.java
package com.collegeManagement.production.dto.response.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentMarkDTO {
    private Integer studentUserId;
    private String studentName;
    private String rollNumber;
    private Integer semester;
    private List<SubjectMarkDTO> subjectMarks;
    private Double overallPercentage;
    private String grade;
}