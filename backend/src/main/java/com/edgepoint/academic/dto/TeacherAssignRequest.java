// src/main/java/com/collegeManagement/dto/request/classmanagement/TeacherAssignmentRequest.java
package com.edgepoint.academic.dto;


import com.edgepoint.academic.domain.AcademicClass;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TeacherAssignRequest {
    @NotNull(message = "Class-subject ID is required")
    private Integer classSubjectId;

    @NotNull(message = "Teacher user ID is required")
    private Integer teacherUserId;
}