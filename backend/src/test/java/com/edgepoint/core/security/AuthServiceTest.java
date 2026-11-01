package com.edgepoint.core.security;

import com.edgepoint.audit.service.AuditService;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.domain.UserRole;
import com.edgepoint.core.dto.ChangePasswordRequest;
import com.edgepoint.core.dto.LoginRequest;
import com.edgepoint.core.dto.RefreshTokenRequest;
import com.edgepoint.core.exception.AuthenticationException;
import com.edgepoint.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService login auditing")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private TenantContext tenantContext;
    @Mock private AuditService auditService;
    @Mock private RefreshTokenService refreshTokenService;
    @InjectMocks private AuthServiceImpl authService;

    private User user;
    private LoginRequest request;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpiration", 1000L);
        user = new User();
        user.setUserId(9);
        user.setCollegeId(3);
        user.setUsername("teacher1");
        user.setPasswordHash("hash");
        user.setIsActive(true);
        user.setIsDeleted(false);
        UserRole role = new UserRole();
        role.setRoleName("TEACHER");
        user.setRole(role);
        request = new LoginRequest();
        request.setUsername("teacher1");
        request.setPassword("pw");
        lenient().when(userRepository.findByUsernameOrEmail("teacher1")).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("login issues a stored refresh token")
    void loginIssuesStoredRefreshToken() {
        when(passwordEncoder.matches("pw", "hash")).thenReturn(true);
        when(refreshTokenService.issue(user)).thenReturn("refresh-1");

        assertThat(authService.login(request).getRefreshToken()).isEqualTo("refresh-1");
    }

    @Test
    @DisplayName("refresh rotates the presented token and returns a new one")
    void refreshRotates() {
        RefreshTokenRequest refresh = new RefreshTokenRequest();
        refresh.setRefreshToken("old");
        when(refreshTokenService.rotate("old")).thenReturn(9);
        when(userRepository.findById(9)).thenReturn(Optional.of(user));
        when(refreshTokenService.issue(user)).thenReturn("new");

        assertThat(authService.refreshToken(refresh).getRefreshToken()).isEqualTo("new");
    }

    @Test
    @DisplayName("refresh is refused for an inactive account")
    void refreshRefusedWhenInactive() {
        RefreshTokenRequest refresh = new RefreshTokenRequest();
        refresh.setRefreshToken("old");
        user.setIsActive(false);
        when(refreshTokenService.rotate("old")).thenReturn(9);
        when(userRepository.findById(9)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.refreshToken(refresh)).isInstanceOf(AuthenticationException.class);
        verify(refreshTokenService, never()).issue(any());
    }

    @Test
    @DisplayName("logout revokes the presented refresh token of the caller")
    void logoutRevokesPresentedToken() {
        when(tenantContext.getCurrentUserId()).thenReturn(9);

        authService.logout("refresh-1");

        verify(refreshTokenService).revoke("refresh-1", 9);
        verify(tenantContext).clear();
    }

    @Test
    @DisplayName("logout without a token still succeeds")
    void logoutWithoutToken() {
        authService.logout(null);

        verifyNoInteractions(refreshTokenService);
        verify(tenantContext).clear();
    }

    @Test
    @DisplayName("changing password revokes every refresh token of the user")
    void changePasswordRevokesAll() {
        ChangePasswordRequest change = new ChangePasswordRequest();
        change.setCurrentPassword("pw");
        change.setNewPassword("pw2");
        change.setConfirmPassword("pw2");
        when(tenantContext.getCurrentUserId()).thenReturn(9);
        when(userRepository.findById(9)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hash")).thenReturn(true);

        authService.changePassword(change);

        verify(refreshTokenService).revokeAll(9);
    }

    @Test
    @DisplayName("wrong password records LOGIN_FAILURE")
    void wrongPasswordAudited() {
        when(passwordEncoder.matches("pw", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request)).isInstanceOf(AuthenticationException.class);

        verify(auditService).recordLogin(user, false);
    }

    @Test
    @DisplayName("successful login records LOGIN_SUCCESS")
    void successAudited() {
        when(passwordEncoder.matches("pw", "hash")).thenReturn(true);

        authService.login(request);

        verify(auditService).recordLogin(user, true);
    }
}
