package com.edgepoint.privacy.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.*;
import com.edgepoint.privacy.service.ConsentService;
import com.edgepoint.privacy.service.DataRequestService;
import com.edgepoint.privacy.service.PrivacyAuditService;
import com.edgepoint.privacy.service.RetentionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Reads are open to COLLEGEADMIN and SUPERADMIN (a SUPERADMIN names the college with ?collegeId=; a
 * COLLEGEADMIN always gets their own). Everything that changes data is COLLEGEADMIN only.
 */
@RestController
@RequestMapping("/privacy/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN','COLLEGEADMIN')")
@Tag(name = "Privacy admin", description = "Request queue, notices, retention and audit")
public class PrivacyAdminController {

    private static final String COLLEGE_ADMIN = "hasRole('COLLEGEADMIN')";

    private final DataRequestService requestService;
    private final ConsentService consentService;
    private final RetentionService retentionService;
    private final PrivacyAuditService auditService;

    @GetMapping("/requests")
    @Operation(summary = "Request queue, oldest due first")
    public ResponseEntity<ApiResponse<Page<DataRequestView>>> queue(
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(defaultValue = "false") boolean overdue,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<DataRequestView> page = requestService.queue(collegeId, status, overdue, pageable).map(DataRequestView::from);
        return ResponseEntity.ok(ApiResponse.success(page, "Requests"));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "One request with its history")
    public ResponseEntity<ApiResponse<DataRequestDetail>> request(@PathVariable Integer id,
                                                                @RequestParam(required = false) Integer collegeId) {
        return ResponseEntity.ok(ApiResponse.success(requestService.detailAdmin(id, collegeId), "Request"));
    }

    @PostMapping("/requests/{id}/review")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Start reviewing a request and assign it to me")
    public ResponseEntity<ApiResponse<DataRequestView>> review(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(DataRequestView.from(requestService.review(id)), "Request is in review"));
    }

    @PostMapping("/requests/{id}/resolve")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Complete, partially complete or reject a request in review")
    public ResponseEntity<ApiResponse<DataRequestView>> resolve(@PathVariable Integer id,
                                                                @Valid @RequestBody ResolveRequest body) {
        DataRequest resolved = requestService.resolve(id, body.outcome(), body.note());
        return ResponseEntity.ok(ApiResponse.success(DataRequestView.from(resolved), "Request " + resolved.getStatus()));
    }

    @GetMapping("/notices")
    @Operation(summary = "All notice versions, newest first")
    public ResponseEntity<ApiResponse<List<PrivacyNotice>>> notices(@RequestParam(required = false) Integer collegeId) {
        return ResponseEntity.ok(ApiResponse.success(consentService.listNotices(collegeId), "Notices"));
    }

    @PostMapping("/notices")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Publish a new notice version")
    public ResponseEntity<ApiResponse<PrivacyNotice>> publishNotice(@Valid @RequestBody NoticeCreate body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(consentService.publishNotice(body.body()), "Notice published"));
    }

    @GetMapping("/retention-policies")
    @Operation(summary = "Retention policies")
    public ResponseEntity<ApiResponse<List<RetentionPolicy>>> policies(@RequestParam(required = false) Integer collegeId) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.policies(collegeId), "Retention policies"));
    }

    @PutMapping("/retention-policies")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Update retention policies")
    public ResponseEntity<ApiResponse<List<RetentionPolicy>>> updatePolicies(
            @RequestBody List<RetentionPolicyUpdate> updates) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.updatePolicies(updates), "Retention policies updated"));
    }

    @PostMapping("/retention/run")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Run retention now; dry run unless dryRun=false")
    public ResponseEntity<ApiResponse<RetentionRun>> run(@RequestParam(defaultValue = "true") boolean dryRun) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.runNow(dryRun), dryRun ? "Dry run finished" : "Retention run finished"));
    }

    @GetMapping("/retention/runs")
    @Operation(summary = "Retention run history")
    public ResponseEntity<ApiResponse<Page<RetentionRun>>> runs(@RequestParam(required = false) Integer collegeId,
                                                               @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.runs(collegeId, pageable), "Retention runs"));
    }

    @GetMapping("/audit")
    @Operation(summary = "Privacy audit trail, newest first")
    public ResponseEntity<ApiResponse<Page<PrivacyAuditLog>>> audit(@RequestParam(required = false) Integer collegeId,
                                                                   @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.search(collegeId, pageable), "Privacy audit"));
    }
}
