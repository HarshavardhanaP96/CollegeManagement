package com.edgepoint.core.security;

import com.edgepoint.audit.service.AuditService;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.domain.UserRole;
import com.edgepoint.core.dto.LoginRequest;
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

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService login auditing")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private TenantContext tenantContext;
    @Mock private AuditService auditService;
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
        when(userRepository.findByUsernameOrEmail("teacher1")).thenReturn(Optional.of(user));
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
