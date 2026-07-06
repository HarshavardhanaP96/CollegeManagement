// src/main/java/com/collegeManagement/dto/response/marks/MarkResponseDTO.java
package com.edgepoint.academic.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MarkResponseDTO {
    private Integer markId;
    private Integer assignmentId;
    private Integer studentUserId;
    private String studentName;
    private Integer examTypeId;
    private String examTypeName;
    private BigDecimal marksObtained;
    private Integer maxMarks;
    private String remarks;
    private LocalDateTime createdAt;
}
