package com.edgepoint.core.security;

import com.edgepoint.core.domain.RefreshToken;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.domain.UserRole;
import com.edgepoint.core.exception.AuthenticationException;
import com.edgepoint.core.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Refresh token store: rotation, reuse detection, revocation")
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository repository;

    private JwtService jwtService;
    private RefreshTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "expiration", 60_000L);
        service = new RefreshTokenService(repository, jwtService);

        user = new User();
        user.setUserId(9);
        user.setUsername("teacher1");
        UserRole role = new UserRole();
        role.setRoleName("TEACHER");
        user.setRole(role);
    }

    private RefreshToken stored(String token, Integer userId) {
        RefreshToken t = new RefreshToken();
        t.setUserId(userId);
        t.setTokenHash(service.hashOf(token));
        t.setExpiresAt(LocalDateTime.now().plusDays(1));
        return t;
    }

    @Test
    @DisplayName("issue stores only a hash of the token id, never the token")
    void issueStoresHash() {
        String token = service.issue(user);

        ArgumentCaptor<RefreshToken> saved = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(9);
        assertThat(saved.getValue().getTokenHash()).hasSize(64).isNotEqualTo(token);
        assertThat(saved.getValue().getTokenHash()).isNotEqualTo(jwtService.extractAllClaims(token).getId());
        assertThat(saved.getValue().getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("rotate revokes the presented token and returns its user")
    void rotateRevokesUsedToken() {
        String token = service.issue(user);
        when(repository.findByTokenHash(service.hashOf(token))).thenReturn(Optional.of(stored(token, 9)));
        when(repository.revokeIfActive(eq(service.hashOf(token)), any())).thenReturn(1);

        assertThat(service.rotate(token)).isEqualTo(9);
        verify(repository, never()).revokeAllForUser(any(), any());
    }

    @Test
    @DisplayName("presenting an already-rotated token revokes every token of that user")
    void reuseRevokesFamily() {
        String token = service.issue(user);
        when(repository.findByTokenHash(service.hashOf(token))).thenReturn(Optional.of(stored(token, 9)));
        when(repository.revokeIfActive(anyString(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(AuthenticationException.class);
        verify(repository).revokeAllForUser(eq(9), any());
    }

    @Test
    @DisplayName("an unknown token is rejected without touching other tokens")
    void unknownRejected() {
        String token = service.issue(user);
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(AuthenticationException.class);
        verify(repository, never()).revokeIfActive(any(), any());
        verify(repository, never()).revokeAllForUser(any(), any());
    }

    @Test
    @DisplayName("an expired token is rejected")
    void expiredRejected() {
        JwtService expiredIssuer = new JwtService();
        ReflectionTestUtils.setField(expiredIssuer, "secretKey", Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(expiredIssuer, "expiration", -60_000L);
        String token = expiredIssuer.generateRefreshToken(user);

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(AuthenticationException.class);
        verify(repository, never()).revokeIfActive(any(), any());
    }

    @Test
    @DisplayName("an access token cannot be used as a refresh token")
    void accessTokenRejected() {
        String accessToken = jwtService.generateToken(user);

        assertThatThrownBy(() -> service.rotate(accessToken)).isInstanceOf(AuthenticationException.class);
        verify(repository, never()).findByTokenHash(any());
    }

    @Test
    @DisplayName("revoke only revokes a token that belongs to the caller")
    void revokeChecksOwner() {
        String mine = service.issue(user);
        when(repository.findByTokenHash(service.hashOf(mine))).thenReturn(Optional.of(stored(mine, 9)));

        service.revoke(mine, 10);
        verify(repository, never()).revokeIfActive(any(), any());

        service.revoke(mine, 9);
        verify(repository).revokeIfActive(eq(service.hashOf(mine)), any());
    }

    @Test
    @DisplayName("revoke ignores garbage instead of failing logout")
    void revokeIgnoresGarbage() {
        service.revoke("not-a-jwt", 9);
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("revokeAll revokes every active token of the user")
    void revokeAll() {
        service.revokeAll(9);
        verify(repository).revokeAllForUser(eq(9), any());
    }
}
