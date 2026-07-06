// src/main/java/com/collegeManagement/dto/response/college/CollegeStatisticsDTO.java
package com.edgepoint.core.dto;

import com.edgepoint.core.domain.College;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "College statistics")
public class CollegeStatisticsDTO {

    @Schema(description = "College ID")
    private Integer collegeId;

    @Schema(description = "College name")
    private String collegeName;

    @Schema(description = "Total departments")
    private Integer totalDepartments;

    @Schema(description = "Total courses")
    private Integer totalCourses;

    @Schema(description = "Total teachers")
    private Integer totalTeachers;

    @Schema(description = "Total students")
    private Integer totalStudents;

    @Schema(description = "Total classes")
    private Integer totalClasses;

    @Schema(description = "Total subjects")
    private Integer totalSubjects;

    @Schema(description = "Active teachers")
    private Integer activeTeachers;

    @Schema(description = "Active students")
    private Integer activeStudents;
}