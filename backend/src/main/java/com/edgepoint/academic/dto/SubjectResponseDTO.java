// src/main/java/com/collegeManagement/dto/response/subject/SubjectResponseDTO.java
package com.edgepoint.academic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubjectResponseDTO {
    private Integer subjectId;
    private Integer deptId;
    private String subjectName;
    private String subjectCode;
    private Integer credits;
    private String subjectType;
    private LocalDateTime createdAt;
}