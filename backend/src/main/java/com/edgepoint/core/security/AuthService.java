// src/main/java/com/collegeManagement/service/auth/AuthService.java
package com.edgepoint.core.security;

import com.edgepoint.core.dto.ChangePasswordRequest;
import com.edgepoint.core.dto.LoginRequest;
import com.edgepoint.core.dto.RefreshTokenRequest;
import com.edgepoint.core.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    /** Revokes the given refresh token if it belongs to the caller; null is allowed. */
    void logout(String refreshToken);
    void changePassword(ChangePasswordRequest request);
    LoginResponse refreshToken(RefreshTokenRequest request);
}