package com.edgepoint.privacy.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.dto.*;
import com.edgepoint.privacy.service.ConsentService;
import com.edgepoint.privacy.service.DataRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/privacy")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Privacy", description = "Notice, consent and data-principal requests")
public class PrivacyController {

    private static final String PRINCIPALS = "hasAnyRole('STUDENT','TEACHER')";

    private final ConsentService consentService;
    private final DataRequestService requestService;

    @GetMapping("/notice/current")
    @Operation(summary = "Current privacy notice with my consent state")
    public ResponseEntity<ApiResponse<NoticeView>> currentNotice() {
        return ResponseEntity.ok(ApiResponse.success(consentService.currentNotice(), "Current privacy notice"));
    }

    @GetMapping("/consents/me")
    @Operation(summary = "My consent per purpose")
    public ResponseEntity<ApiResponse<List<PurposeView>>> myConsents() {
        return ResponseEntity.ok(ApiResponse.success(consentService.myConsents(), "Consents"));
    }

    @PostMapping("/consents")
    @Operation(summary = "Grant or withdraw consent for one purpose")
    public ResponseEntity<ApiResponse<PurposeView>> recordConsent(@Valid @RequestBody ConsentRequest body,
                                                                  HttpServletRequest http) {
        PurposeView view = consentService.recordConsent(body.purposeId(), body.status(), http.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success(view, "Consent recorded"));
    }

    @PostMapping("/requests")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "Raise an access, correction, erasure or grievance request")
    public ResponseEntity<ApiResponse<DataRequestView>> submit(@Valid @RequestBody DataRequestCreate body) {
        DataRequest saved = requestService.submit(body.type(), body.details(), body.correction());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(DataRequestView.from(saved), "Request submitted"));
    }

    @GetMapping("/requests/me")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "My requests, newest first")
    public ResponseEntity<ApiResponse<List<DataRequestView>>> myRequests() {
        List<DataRequestView> views = requestService.mine().stream().map(DataRequestView::from).toList();
        return ResponseEntity.ok(ApiResponse.success(views, "Requests"));
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "One of my requests with its history")
    public ResponseEntity<ApiResponse<DataRequestDetail>> myRequest(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.detailMine(id), "Request"));
    }

    @PostMapping("/requests/{id}/cancel")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "Cancel my request while it is still submitted")
    public ResponseEntity<ApiResponse<DataRequestView>> cancel(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(DataRequestView.from(requestService.cancel(id)), "Request cancelled"));
    }

    @GetMapping(value = "/requests/{id}/export", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "Download the data bundle of my completed access request")
    public ResponseEntity<String> export(@PathVariable Integer id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"my-data-request-" + id + ".json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestService.exportFor(id));
    }
}
