// src/main/java/com/collegeManagement/dto/response/teacher/TeacherAssignmentDTO.java
package com.edgepoint.teacher.dto;

import lombok.Data;

@Data
public class TeacherAssignmentDTO {
    private Integer assignmentId;
    private Integer classId;
    private String className;
    private Integer subjectId;
    private String subjectName;
}