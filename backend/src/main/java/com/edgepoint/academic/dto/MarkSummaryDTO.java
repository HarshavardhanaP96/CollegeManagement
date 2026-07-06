// src/main/java/com/collegeManagement/dto/response/marks/MarksSummaryDTO.java
package com.edgepoint.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkSummaryDTO {
    private Integer assignmentId;
    private Integer examTypeId;
    private String examTypeName;
    private Integer totalStudents;
    private Integer enteredCount;
    private Double averageMarks;
    private Double averagePercentage;
    private Integer maxMarks;
}