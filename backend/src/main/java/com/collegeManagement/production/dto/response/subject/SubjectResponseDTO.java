// src/main/java/com/collegeManagement/dto/response/subject/SubjectResponseDTO.java
package com.collegeManagement.production.dto.response.subject;

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