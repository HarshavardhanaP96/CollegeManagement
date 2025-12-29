// src/main/java/com/collegeManagement/dto/request/classmanagement/AddSubjectToClassRequest.java
package com.collegeManagement.production.dto.request.classmanagement;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddSubjectToClassRequest {
    @NotNull(message = "Subject ID is required")
    private Integer subjectId;
}