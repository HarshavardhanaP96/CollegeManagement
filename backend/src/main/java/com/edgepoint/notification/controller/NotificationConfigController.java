package com.edgepoint.notification.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.notification.dto.NotificationConfigDto;
import com.edgepoint.notification.dto.NotificationConfigRequest;
import com.edgepoint.notification.service.NotificationConfigService;
import com.edgepoint.core.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * REST endpoints for per-college Email (SMTP) and WhatsApp configuration.
 *
 * <pre>
 * GET  /colleges/{collegeId}/notification-config
 *      → SUPERADMIN   : read any college
 *      → COLLEGEADMIN : read own college only (enforced by service guard)
 *
 * PUT  /colleges/{collegeId}/notification-config
 *      → SUPERADMIN only
 * </pre>
 */
@Slf4j
@RestController
@RequestMapping("/colleges/{collegeId}/notification-config")
@RequiredArgsConstructor
@Tag(name = "Notification Config", description = "Per-college SMTP and WhatsApp configuration")
public class NotificationConfigController {

    private final NotificationConfigService service;
    private final TenantContext tenantContext;

    /** ── GET ── Both SUPERADMIN and COLLEGEADMIN can read. */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')")
    @Operation(summary = "Get notification config", description = "Returns SMTP and WhatsApp settings for a college. Secrets are never included in the response.")
    public ResponseEntity<ApiResponse<NotificationConfigDto>> getConfig(
            @Parameter(description = "College ID") @PathVariable Integer collegeId) {

        // COLLEGEADMIN may only read their own college's config
        if (isCollegeAdmin() && !collegeId.equals(tenantContext.getCollegeId())) {
            return ResponseEntity.status(403).body(
                    ApiResponse.<NotificationConfigDto>builder()
                            .success(false)
                            .message("Access denied: you can only view your own college's configuration")
                            .timestamp(LocalDateTime.now())
                            .build()
            );
        }

        NotificationConfigDto dto = service.getConfig(collegeId);

        return ResponseEntity.ok(
                ApiResponse.<NotificationConfigDto>builder()
                        .success(true)
                        .message("Notification configuration retrieved")
                        .data(dto)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    /** ── PUT ── SUPERADMIN only — creates or updates. */
    @PutMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Save notification config", description = "Creates or updates SMTP and WhatsApp settings for a college. Supply password / API key only when changing them.")
    public ResponseEntity<ApiResponse<NotificationConfigDto>> upsertConfig(
            @Parameter(description = "College ID") @PathVariable Integer collegeId,
            @RequestBody NotificationConfigRequest request) {

        log.info("SuperAdmin updating notification config for collegeId={}", collegeId);

        NotificationConfigDto dto = service.upsert(collegeId, request);

        return ResponseEntity.ok(
                ApiResponse.<NotificationConfigDto>builder()
                        .success(true)
                        .message("Notification configuration saved successfully")
                        .data(dto)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private boolean isCollegeAdmin() {
        // Role IDs: 1 = SUPERADMIN, 2 = COLLEGEADMIN (adjust if your seeder uses different values)
        Integer roleId = tenantContext.getRoleId();
        return roleId != null && roleId == 2;
    }
}
