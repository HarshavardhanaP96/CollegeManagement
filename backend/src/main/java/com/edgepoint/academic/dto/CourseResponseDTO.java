// src/main/java/com/collegeManagement/dto/response/course/CourseResponseDTO.java
package com.edgepoint.academic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CourseResponseDTO {
    private Integer courseId;
    private Integer collegeId;
    private String courseName;
    private String courseCode;
    private Integer durationYears;
    private Integer totalSemesters;
    private LocalDateTime createdAt;
}