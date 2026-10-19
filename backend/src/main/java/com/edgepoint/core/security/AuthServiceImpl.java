// src/main/java/com/collegeManagement/service/auth/AuthServiceImpl.java
package com.edgepoint.core.security;

import com.edgepoint.audit.service.AuditService;
import com.edgepoint.core.dto.ChangePasswordRequest;
import com.edgepoint.core.dto.LoginRequest;
import com.edgepoint.core.dto.RefreshTokenRequest;
import com.edgepoint.core.dto.LoginResponse;
import com.edgepoint.core.dto.UserResponseDTO;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.AuthenticationException;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.security.JwtService;
import com.edgepoint.core.security.TenantContext;
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
    private final JwtService jwtService;
    private final TenantContext tenantContext;
    private final AuditService auditService;

    @Value("${spring.security.jwt.expiration}")
    private Long jwtExpiration;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("No account found with the provided username or email"));

        if (!user.getIsActive()) {
            auditService.recordLogin(user, false);
            throw new AuthenticationException("Your account is currently inactive. Please contact the administrator.");
        }

        if (user.getIsDeleted()) {
            throw new AuthenticationException("This account has been deleted. Please contact the administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditService.recordLogin(user, false);
            throw new AuthenticationException("Wrong password. Please check your credentials and try again.");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        auditService.recordLogin(user, true);

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
        if (!jwtService.validateToken(request.getRefreshToken())) {
            throw new AuthenticationException("Invalid or expired refresh token");
        }

        String username = jwtService.extractUsername(request.getRefreshToken());
        User user = userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!user.getIsActive()) {
            throw new AuthenticationException("Account is inactive");
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

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