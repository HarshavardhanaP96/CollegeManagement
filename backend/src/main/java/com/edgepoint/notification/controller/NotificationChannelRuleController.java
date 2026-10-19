package com.edgepoint.notification.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.notification.dto.NotificationChannelRuleDto;
import com.edgepoint.notification.dto.NotificationChannelRuleRequest;
import com.edgepoint.notification.service.NotificationChannelRuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * GET/PUT /colleges/{collegeId}/notification-channel-rules
 * SUPERADMIN: any college. COLLEGEADMIN: own college only (enforced in the service).
 */
@RestController
@RequestMapping("/colleges/{collegeId}/notification-channel-rules")
@RequiredArgsConstructor
@Tag(name = "Notification Channel Rules", description = "Per-event routing to email / WhatsApp")
public class NotificationChannelRuleController {

    private final NotificationChannelRuleService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')")
    @Operation(summary = "Get channel rules", description = "One entry per event type, defaults filled in.")
    public ResponseEntity<ApiResponse<List<NotificationChannelRuleDto>>> getRules(@PathVariable Integer collegeId) {
        return ok("Notification channel rules retrieved", service.getRules(collegeId));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')")
    @Operation(summary = "Save channel rules")
    public ResponseEntity<ApiResponse<List<NotificationChannelRuleDto>>> updateRules(
            @PathVariable Integer collegeId,
            @RequestBody @Valid List<NotificationChannelRuleRequest> requests) {
        return ok("Notification channel rules saved", service.updateRules(collegeId, requests));
    }

    private static <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) {
        return ResponseEntity.ok(ApiResponse.<T>builder()
                .success(true).message(message).data(data).timestamp(LocalDateTime.now()).build());
    }
}
