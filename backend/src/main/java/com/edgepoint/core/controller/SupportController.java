package com.edgepoint.core.controller;

import com.edgepoint.core.alerting.DiscordAlertService;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.core.dto.SupportRequest;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lets any authenticated user submit a support query. Forwarded directly to Discord — nothing
 * is persisted (see docs/OBSERVABILITY.md for why: this was scoped as a simple contact form,
 * not a ticketing system).
 */
@Slf4j
@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Support", description = "Submit a support query")
public class SupportController {

    private final DiscordAlertService discordAlertService;
    private final UserRepository userRepository;
    private final TenantContext tenantContext;

    @PostMapping
    @Operation(summary = "Submit a support query", description = "Forwards the query to the ops Discord channel")
    public ResponseEntity<ApiResponse<Void>> submitSupportRequest(
            @Valid @RequestBody SupportRequest request, Authentication authentication) {

        String submitter = describeSubmitter(authentication);
        log.info("Support query submitted by {}: {}", submitter, request.getSubject());

        discordAlertService.alertSupportSubmission(
                "📬 Support query: " + request.getSubject(),
                String.format("**From:** %s%n%n%s", submitter, request.getMessage())
        );

        return ResponseEntity.ok(ApiResponse.success(null, "Your support query has been submitted"));
    }

    private String describeSubmitter(Authentication authentication) {
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replaceFirst("^ROLE_", ""))
                .orElse("UNKNOWN");

        Integer userId = tenantContext.getCurrentUserId();
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                return String.format("%s (%s, %s) [%s]", user.getFullName(), username, role, user.getEmail());
            }
        }
        return String.format("%s (%s)", username, role);
    }
}
