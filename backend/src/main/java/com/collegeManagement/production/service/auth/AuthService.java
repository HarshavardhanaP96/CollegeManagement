// src/main/java/com/collegeManagement/service/auth/AuthService.java
package com.collegeManagement.production.service.auth;

import com.collegeManagement.production.dto.request.auth.ChangePasswordRequest;
import com.collegeManagement.production.dto.request.auth.LoginRequest;
import com.collegeManagement.production.dto.request.auth.RefreshTokenRequest;
import com.collegeManagement.production.dto.response.auth.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void logout();
    void changePassword(ChangePasswordRequest request);
    LoginResponse refreshToken(RefreshTokenRequest request);
}