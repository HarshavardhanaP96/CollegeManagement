// src/main/java/com/collegeManagement/dto/response/student/SubjectMarksDTO.java
package com.edgepoint.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectMarkDTO {
    private Integer subjectId;
    private String subjectName;
    private String subjectCode;
    private List<ExamMarkDTO> examMarks;
    private BigDecimal totalMarks;
    private Integer totalMaxMarks;
    private Double percentage;
}