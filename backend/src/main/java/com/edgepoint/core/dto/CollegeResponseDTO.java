// src/main/java/com/collegeManagement/dto/response/college/CollegeResponseDTO.java
package com.edgepoint.core.dto;

import com.edgepoint.core.domain.College;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "College response DTO")
public class CollegeResponseDTO {

    @Schema(description = "College ID")
    private Integer collegeId;

    @Schema(description = "College name")
    private String collegeName;

    @Schema(description = "College code")
    private String collegeCode;

    @Schema(description = "College address")
    private String address;

    @Schema(description = "Contact email")
    private String contactEmail;

    @Schema(description = "Contact phone")
    private String contactPhone;

    @Schema(description = "Total departments")
    private Integer totalDepartments;

    @Schema(description = "Total teachers")
    private Integer totalTeachers;

    @Schema(description = "Total students")
    private Integer totalStudents;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
}