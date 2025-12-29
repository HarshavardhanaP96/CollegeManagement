// src/main/java/com/collegeManagement/dto/response/teacher/TeacherAssignmentDTO.java
package com.collegeManagement.production.dto.response.teacher;

import lombok.Data;

@Data
public class TeacherAssignmentDTO {
    private Integer assignmentId;
    private Integer classId;
    private String className;
    private Integer subjectId;
    private String subjectName;
}