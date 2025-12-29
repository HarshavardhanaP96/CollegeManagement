// src/main/java/com/collegeManagement/dto/request/department/AssignHODRequest.java
package com.collegeManagement.production.dto.request.department;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignHODRequest {
    @NotNull(message = "HOD user ID is required")
    private Integer hodUserId;
}