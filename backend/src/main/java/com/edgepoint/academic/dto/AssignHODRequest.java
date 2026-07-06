// src/main/java/com/collegeManagement/dto/request/department/AssignHODRequest.java
package com.edgepoint.academic.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignHODRequest {
    @NotNull(message = "HOD user ID is required")
    private Integer hodUserId;
}