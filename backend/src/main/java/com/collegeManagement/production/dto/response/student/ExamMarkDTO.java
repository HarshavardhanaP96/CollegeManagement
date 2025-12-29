// src/main/java/com/collegeManagement/dto/response/student/ExamMarksDTO.java
package com.collegeManagement.production.dto.response.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamMarkDTO {
    private String examTypeName;
    private BigDecimal marksObtained;
    private Integer maxMarks;
    private Double percentage;
}