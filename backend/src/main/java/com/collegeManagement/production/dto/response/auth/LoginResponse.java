// src/main/java/com/collegeManagement/dto/response/auth/LoginResponse.java
package com.collegeManagement.production.dto.response.auth;

import com.collegeManagement.production.dto.response.user.UserResponseDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Login response with JWT token and user details")
public class LoginResponse {

    @Schema(description = "JWT access token")
    private String accessToken;

    @Schema(description = "Token type", example = "Bearer")
    private String tokenType;

    @Schema(description = "Token expiration time in milliseconds", example = "86400000")
    private Long expiresIn;

    @Schema(description = "Refresh token for getting new access token")
    private String refreshToken;

    @Schema(description = "User details")
    private UserResponseDTO user;
}
