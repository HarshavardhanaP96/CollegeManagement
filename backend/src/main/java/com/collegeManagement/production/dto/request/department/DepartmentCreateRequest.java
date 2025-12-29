// src/main/java/com/collegeManagement/dto/request/department/DepartmentCreateRequest.java
package com.collegeManagement.production.dto.request.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DepartmentCreateRequest {
    @NotBlank(message = "Department name is required")
    @Size(max = 100)
    private String deptName;

    @NotBlank(message = "Department code is required")
    @Size(max = 20)
    private String deptCode;
}