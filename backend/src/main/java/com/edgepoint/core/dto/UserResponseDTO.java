// src/main/java/com/collegeManagement/dto/response/user/UserResponseDTO.java
package com.edgepoint.core.dto;

import com.edgepoint.core.domain.College;
import com.edgepoint.core.domain.User;

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
@Schema(description = "User response DTO")
public class UserResponseDTO {

    @Schema(description = "User ID")
    private Integer userId;

    @Schema(description = "College ID")
    private Integer collegeId;

    @Schema(description = "College name")
    private String collegeName;

    @Schema(description = "Role ID")
    private Integer roleId;

    @Schema(description = "Role name", example = "Teacher")
    private String roleName;

    @Schema(description = "Username")
    private String username;

    @Schema(description = "Email address")
    private String email;

    @Schema(description = "Full name")
    private String fullName;

    @Schema(description = "Phone number")
    private String phone;

    @Schema(description = "Account active status")
    private Boolean isActive;

    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;
}