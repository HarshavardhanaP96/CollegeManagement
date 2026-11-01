package com.edgepoint.core.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT Authentication Filter.
 * Intercepts every HTTP request, extracts the JWT token from the Authorization header,
 * validates it, and populates the Spring Security context with the authenticated user.
 * Also sets TenantContext for multi-tenant data scoping.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtTokenUtil;
    private final TenantContext tenantContext;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            authenticate(request, response, filterChain);
        } finally {
            // TenantContext is a ThreadLocal and servlet threads are pooled: never let it reach the next request.
            tenantContext.clear();
        }
    }

    private void authenticate(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Skip if no Authorization header or not Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            if (jwtTokenUtil.validateToken(jwt)) {
                Claims claims = jwtTokenUtil.extractAllClaims(jwt);
                if (!JwtService.ACCESS_TOKEN_TYPE.equals(claims.get(JwtService.TOKEN_TYPE_CLAIM, String.class))) {
                    log.debug("Rejected a non-access token presented as a bearer token");
                    filterChain.doFilter(request, response);
                    return;
                }
                String username = claims.getSubject();
                Integer userId = claims.get("userId", Integer.class);
                Integer collegeId = claims.get("collegeId", Integer.class);
                Integer roleId = claims.get("roleId", Integer.class);
                String roleName = claims.get("roleName", String.class);

                // Only set authentication if not already set
                if (SecurityContextHolder.getContext().getAuthentication() == null) {

                    // Create authority with ROLE_ prefix for Spring Security hasRole() checks
                    List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + roleName)
                    );

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Set tenant context for multi-tenant data scoping
                    tenantContext.setContext(userId, collegeId, roleId);

                    log.debug("Authenticated user: {} with role: {}", username, roleName);
                }
            }
        } catch (Exception e) {
            log.warn("JWT authentication failed: {}", e.getMessage());
            // Don't set authentication — request will be treated as anonymous
        }

        filterChain.doFilter(request, response);
    }
}
