// src/main/java/com/collegeManagement/service/auth/AuthServiceImpl.java
package com.collegeManagement.production.service.auth;

import com.collegeManagement.production.dto.request.auth.ChangePasswordRequest;
import com.collegeManagement.production.dto.request.auth.LoginRequest;
import com.collegeManagement.production.dto.request.auth.RefreshTokenRequest;
import com.collegeManagement.production.dto.response.auth.LoginResponse;
import com.collegeManagement.production.dto.response.user.UserResponseDTO;
import com.collegeManagement.production.entity.User;
import com.collegeManagement.production.exception.AuthenticationException;
import com.collegeManagement.production.exception.BadRequestException;
import com.collegeManagement.production.repository.UserRepository;
import com.collegeManagement.production.security.JwtTokenUtil;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final TenantContext tenantContext;

    @Value("${spring.security.jwt.expiration}")
    private Long jwtExpiration;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid username or password"));

        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive");
        }

        if (user.getIsDeleted()) {
            throw new AuthenticationException("Account has been deleted");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }

        String accessToken = jwtTokenUtil.generateToken(user);
        String refreshToken = jwtTokenUtil.generateRefreshToken(user);

        UserResponseDTO userDTO = mapToUserDTO(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .refreshToken(refreshToken)
                .user(userDTO)
                .build();
    }

    @Override
    public void logout() {
        tenantContext.clear();
        log.info("User logged out successfully");
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Integer userId = tenantContext.getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedBy(userId);
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        if (!jwtTokenUtil.validateToken(request.getRefreshToken())) {
            throw new AuthenticationException("Invalid or expired refresh token");
        }

        String username = jwtTokenUtil.extractUsername(request.getRefreshToken());
        User user = userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive");
        }

        String newAccessToken = jwtTokenUtil.generateToken(user);
        String newRefreshToken = jwtTokenUtil.generateRefreshToken(user);

        UserResponseDTO userDTO = mapToUserDTO(user);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .refreshToken(newRefreshToken)
                .user(userDTO)
                .build();
    }

    private UserResponseDTO mapToUserDTO(User user) {
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .collegeId(user.getCollegeId())
                .collegeName(user.getCollege() != null ? user.getCollege().getCollegeName() : null)
                .roleId(user.getRoleId())
                .roleName(user.getRole().getRoleName())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}