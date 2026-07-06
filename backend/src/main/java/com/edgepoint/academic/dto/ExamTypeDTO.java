// src/main/java/com/collegeManagement/dto/response/marks/ExamTypeDTO.java
package com.edgepoint.academic.dto;

import lombok.Data;

@Data
public class ExamTypeDTO {
    private Integer examTypeId;
    private String examTypeName;
    private Integer maxMarks;
}