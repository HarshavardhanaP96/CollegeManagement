// src/main/java/com/collegeManagement/dto/response/classmanagement/ClassResponseDTO.java
package com.edgepoint.academic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClassResponseDTO {
    private Integer classId;
    private Integer deptId;
    private Integer courseId;
    private String academicYear;
    private Integer semester;
    private String section;
    private String className;
    private LocalDateTime createdAt;
}
