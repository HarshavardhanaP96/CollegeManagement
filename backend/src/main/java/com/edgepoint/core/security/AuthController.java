// ============================================
// src/main/java/com/collegeManagement/production/controller/auth/AuthController.java
// ============================================

package com.edgepoint.core.security;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.dto.ApiResponse;

import com.edgepoint.core.dto.ChangePasswordRequest;
import com.edgepoint.core.dto.LoginRequest;
import com.edgepoint.core.dto.RefreshTokenRequest;
import com.edgepoint.core.dto.LoginResponse;
import com.edgepoint.core.security.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Controller for handling authentication operations
 * Endpoints: login, logout, password change, token refresh
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication management APIs")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
            summary = "User login",
            description = "Authenticate user with username/email and password, returns JWT token"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Login successful",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Invalid credentials"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Account inactive or deleted"
            )
    })
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        LoginResponse response = authService.login(request);

        log.info("Login successful for user: {} with role: {}",
                request.getUsername(), response.getUser().getRoleName());

        return ResponseEntity.ok(
                ApiResponse.<LoginResponse>builder()
                        .success(true)
                        .message("Login successful")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "User logout",
            description = "Logout current user (invalidates token on client side)"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Logout successful"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            )
    })
    public ResponseEntity<ApiResponse<Void>> logout() {
        log.info("User logout requested");

        authService.logout();

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Logout successful")
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Change password",
            description = "Change password for currently authenticated user"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Password changed successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Validation error or passwords don't match"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Current password is incorrect"
            )
    })
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        log.info("Password change requested");

        authService.changePassword(request);

        log.info("Password changed successfully");

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Password changed successfully. Please login with new password.")
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PostMapping("/refresh-token")
    @Operation(
            summary = "Refresh JWT token",
            description = "Get new access token using refresh token"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Token refreshed successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Invalid or expired refresh token"
            )
    })
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh requested");

        LoginResponse response = authService.refreshToken(request);

        return ResponseEntity.ok(
                ApiResponse.<LoginResponse>builder()
                        .success(true)
                        .message("Token refreshed successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @GetMapping("/validate-token")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Validate JWT token",
            description = "Check if current JWT token is valid"
    )
    public ResponseEntity<ApiResponse<Boolean>> validateToken() {
        return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                        .success(true)
                        .message("Token is valid")
                        .data(true)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}