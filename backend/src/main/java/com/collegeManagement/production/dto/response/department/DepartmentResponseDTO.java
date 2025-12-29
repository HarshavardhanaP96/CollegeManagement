// src/main/java/com/collegeManagement/dto/response/department/DepartmentResponseDTO.java
package com.collegeManagement.production.dto.response.department;

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