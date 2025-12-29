// src/main/java/com/collegeManagement/dto/request/classmanagement/TeacherAssignmentRequest.java
package com.collegeManagement.production.dto.request.classmanagement;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TeacherAssignRequest {
    @NotNull(message = "Class-subject ID is required")
    private Integer classSubjectId;

    @NotNull(message = "Teacher user ID is required")
    private Integer teacherUserId;
}