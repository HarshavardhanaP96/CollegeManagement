package com.edgepoint.core.security;

import com.edgepoint.core.domain.RefreshToken;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.AuthenticationException;
import com.edgepoint.core.repository.RefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;

/**
 * Server-side refresh tokens: issued on login, rotated on every refresh, revoked on logout and
 * password change. Presenting an already-rotated token is treated as theft and revokes all of
 * the user's tokens.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String INVALID = "Invalid or expired refresh token";

    private final RefreshTokenRepository repository;
    private final JwtService jwtService;

    public String issue(User user) {
        String token = jwtService.generateRefreshToken(user);
        Claims claims = jwtService.extractAllClaims(token);
        RefreshToken stored = new RefreshToken();
        stored.setUserId(user.getUserId());
        stored.setTokenHash(hash(claims.getId()));
        stored.setExpiresAt(LocalDateTime.ofInstant(claims.getExpiration().toInstant(), ZoneId.systemDefault()));
        repository.save(stored);
        return token;
    }

    /** Revokes the presented token and returns its user id; the caller issues the replacement. */
    public Integer rotate(String token) {
        String hash = hashOf(token);
        if (hash == null) {
            throw new AuthenticationException(INVALID);
        }
        RefreshToken stored = repository.findByTokenHash(hash)
                .orElseThrow(() -> new AuthenticationException(INVALID));
        LocalDateTime now = LocalDateTime.now();
        if (repository.revokeIfActive(hash, now) == 0) {
            log.warn("Refresh token reuse detected for user {}; revoking all their sessions", stored.getUserId());
            repository.revokeAllForUser(stored.getUserId(), now);
            throw new AuthenticationException(INVALID);
        }
        return stored.getUserId();
    }

    /** Best effort: logout must not fail because the client sent a bad or foreign token. */
    public void revoke(String token, Integer userId) {
        String hash = hashOf(token);
        if (hash == null) {
            return;
        }
        repository.findByTokenHash(hash)
                .filter(t -> t.getUserId().equals(userId))
                .ifPresent(t -> repository.revokeIfActive(hash, LocalDateTime.now()));
    }

    public void revokeAll(Integer userId) {
        repository.revokeAllForUser(userId, LocalDateTime.now());
    }

    /** Hash of a valid, unexpired refresh token's jti, or null if the token isn't one. */
    String hashOf(String token) {
        try {
            String jti = jwtService.extractAllClaims(token).getId();
            return jti == null ? null : hash(jti);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
