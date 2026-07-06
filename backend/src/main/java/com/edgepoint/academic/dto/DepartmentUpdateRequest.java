// src/main/java/com/collegeManagement/dto/request/department/DepartmentUpdateRequest.java
package com.edgepoint.academic.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DepartmentUpdateRequest {
    @Size(max = 100)
    private String deptName;
}