// src/main/java/com/collegeManagement/dto/response/teacher/RecentActivityDTO.java
package com.collegeManagement.production.dto.response.teacher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDTO {
    private String activityType; // ATTENDANCE, MARKS
    private String description;
    private LocalDateTime timestamp;
}