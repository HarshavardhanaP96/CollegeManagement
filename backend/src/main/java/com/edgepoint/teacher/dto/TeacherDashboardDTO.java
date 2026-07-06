// src/main/java/com/collegeManagement/dto/response/teacher/TeacherDashboardDTO.java
package com.edgepoint.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDashboardDTO {
    private String teacherName;
    private String department;
    private Integer totalAssignments;
    private Integer totalClasses;
    private Integer totalStudents;
    private List<TeacherAssignmentDTO> activeAssignments;
    private List<RecentActivityDTO> recentActivities;
}