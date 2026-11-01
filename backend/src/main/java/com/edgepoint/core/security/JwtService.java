// src/main/java/com/collegeManagement/security/JwtTokenUtil.java
package com.edgepoint.core.security;

import com.edgepoint.core.domain.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtService {

    @Value("${spring.security.jwt.secret-key}")
    private String secretKey;

    @Value("${spring.security.jwt.expiration}")
    private Long expiration;

    // Only the dev and test profiles set this; everywhere else a missing JWT_SECRET stops startup.
    @Value("${app.security.ephemeral-jwt-key:false}")
    private boolean ephemeralKeyAllowed;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        if (secretKey != null && !secretKey.isBlank()) {
            signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
        } else if (ephemeralKeyAllowed) {
            log.warn("JWT_SECRET not set: signing with a random per-process key; tokens die on restart");
            signingKey = Jwts.SIG.HS256.key().build();
        } else {
            throw new IllegalStateException("JWT_SECRET must be set (base64, at least 32 bytes)");
        }
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("collegeId", user.getCollegeId());
        claims.put("roleId", user.getRoleId());
        claims.put("roleName", user.getRole().getRoleName());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 7)) // 7 days
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey getSigningKey() {
        return signingKey;
    }
}