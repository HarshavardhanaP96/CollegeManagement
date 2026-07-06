// src/main/java/com/collegeManagement/dto/response/department/DepartmentResponseDTO.java
package com.edgepoint.academic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DepartmentResponseDTO {
    private Integer deptId;
    private Integer collegeId;
    private String deptName;
    private String deptCode;
    private Integer deptHeadUserId;
    private String deptHeadName;
    private LocalDateTime createdAt;
}