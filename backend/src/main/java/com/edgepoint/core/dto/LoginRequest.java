// ============================================
// DTOs for Authentication
// ============================================

// src/main/java/com/collegeManagement/dto/request/auth/LoginRequest.java
package com.edgepoint.core.dto;

import com.edgepoint.core.domain.User;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Login request payload")
public class LoginRequest {

    @NotBlank(message = "Username is required")
    @Schema(description = "Username or email", example = "john.teacher")
    private String username;

    @NotBlank(message = "Password is required")
    @Schema(description = "User password", example = "Password123!")
    private String password;
}
