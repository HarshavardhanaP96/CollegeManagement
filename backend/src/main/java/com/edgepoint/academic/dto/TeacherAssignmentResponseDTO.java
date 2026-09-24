package com.edgepoint.academic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TeacherAssignmentResponseDTO {
    private Integer assignmentId;
    private Integer classSubjectId;
    private String className;
    private String subjectName;
    private Integer teacherUserId;
    private String teacherName;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
