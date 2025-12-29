// src/main/java/com/collegeManagement/dto/request/auth/RefreshTokenRequest.java
package com.collegeManagement.production.dto.request.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Refresh token request payload")
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    @Schema(description = "Refresh token")
    private String refreshToken;
}