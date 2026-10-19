package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.config.PrivacyProperties;
import com.edgepoint.privacy.contributor.PersonalDataContributor;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.DataRequestDetail;
import com.edgepoint.privacy.dto.DataRequestView;
import com.edgepoint.privacy.dto.RequestEventView;
import com.edgepoint.privacy.repository.DataRequestEventRepository;
import com.edgepoint.privacy.repository.DataRequestRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DataRequestService {

    private final DataRequestRepository requests;
    private final DataRequestEventRepository events;
    private final List<PersonalDataContributor> contributors;
    private final ErasureService erasure;
    private final PrivacyAuditService audit;
    private final PrivacyTenant tenant;
    private final PrivacyProperties properties;
    private final ObjectMapper mapper;

    // ---------------------------------------------------------------- principal side

    @Transactional
    public DataRequest submit(RequestType type, String details, Map<String, String> correction) {
        Integer college = tenant.collegeId();
        Integer user = tenant.userId();
        String payload = null;
        if (type == RequestType.CORRECTION) {
            payload = validatedCorrection(correction);
        } else if (type == RequestType.GRIEVANCE) {
            if (details == null || details.isBlank()) {
                throw new BusinessRuleViolationException("Please describe your grievance");
            }
        } else if (type == RequestType.ERASURE
                && requests.existsByUserIdAndTypeAndStatusIn(user, RequestType.ERASURE, RequestStatus.OPEN)) {
            throw new BusinessRuleViolationException("You already have an open erasure request");
        }
        LocalDateTime now = LocalDateTime.now();
        DataRequest r = new DataRequest();
        r.setCollegeId(college);
        r.setUserId(user);
        r.setType(type);
        r.setStatus(RequestStatus.SUBMITTED);
        r.setDetails(details == null || details.isBlank() ? null : details.trim());
        r.setCorrectionPayload(payload);
        r.setSubmittedAt(now);
        r.setDueAt(now.plusDays(properties.getResponseDays()));
        DataRequest saved = requests.save(r);
        recordEvent(saved, null, RequestStatus.SUBMITTED, user, null);
        audit.record(college, user, user, "REQUEST_SUBMITTED", "type=" + type + ", requestId=" + saved.getRequestId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DataRequest> mine() {
        return requests.findByUserIdOrderBySubmittedAtDesc(tenant.userId());
    }

    @Transactional(readOnly = true)
    public DataRequestDetail detailMine(Integer requestId) {
        return detail(loadOwn(requestId));
    }

    @Transactional
    public DataRequest cancel(Integer requestId) {
        DataRequest r = loadOwn(requestId);
        Integer user = tenant.userId();
        transition(r, RequestStatus.CANCELLED, user, null);
        r.setResolvedAt(LocalDateTime.now());
        DataRequest saved = requests.save(r);
        audit.record(r.getCollegeId(), user, user, "REQUEST_CANCELLED", "requestId=" + requestId);
        return saved;
    }

    @Transactional
    public String exportFor(Integer requestId) {
        DataRequest r = loadOwn(requestId);
        if (r.getType() != RequestType.ACCESS || r.getStatus() != RequestStatus.COMPLETED || r.getExportPayload() == null) {
            throw new BusinessRuleViolationException("No export is available for this request");
        }
        audit.record(r.getCollegeId(), r.getUserId(), r.getUserId(), "EXPORT_DOWNLOADED", "requestId=" + requestId);
        return r.getExportPayload();
    }

    // ---------------------------------------------------------------- admin side

    @Transactional(readOnly = true)
    public Page<DataRequest> queue(Integer collegeParam, RequestStatus status, boolean overdueOnly, Pageable pageable) {
        Integer college = tenant.collegeId(collegeParam);
        Pageable oldestDueFirst = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("dueAt").ascending());
        if (overdueOnly) {
            return requests.findByCollegeIdAndStatusInAndDueAtBefore(college, RequestStatus.OPEN, LocalDateTime.now(), oldestDueFirst);
        }
        if (status != null) {
            return requests.findByCollegeIdAndStatus(college, status, oldestDueFirst);
        }
        return requests.findByCollegeId(college, oldestDueFirst);
    }

    @Transactional(readOnly = true)
    public DataRequestDetail detailAdmin(Integer requestId, Integer collegeParam) {
        return detail(load(requestId, tenant.collegeId(collegeParam)));
    }

    @Transactional
    public DataRequest review(Integer requestId) {
        Integer college = tenant.collegeId();
        Integer admin = tenant.userId();
        DataRequest r = load(requestId, college);
        forbidSelfAction(r, admin);
        transition(r, RequestStatus.IN_REVIEW, admin, null);
        r.setAssignedTo(admin);
        DataRequest saved = requests.save(r);
        audit.record(college, admin, r.getUserId(), "REQUEST_IN_REVIEW", "requestId=" + requestId);
        return saved;
    }

    @Transactional
    public DataRequest resolve(Integer requestId, RequestStatus outcome, String note) {
        Integer college = tenant.collegeId();
        Integer admin = tenant.userId();
        DataRequest r = load(requestId, college);
        forbidSelfAction(r, admin);
        if (note == null || note.isBlank()) {
            throw new BusinessRuleViolationException("A resolution note is required");
        }
        if (!r.getStatus().canTransitionTo(outcome)) {
            throw new BusinessRuleViolationException("Cannot move a request from " + r.getStatus() + " to " + outcome);
        }
        if (outcome == RequestStatus.PARTIALLY_COMPLETED && r.getType() != RequestType.ERASURE) {
            throw new BusinessRuleViolationException("Only erasure requests can be partially completed");
        }
        if (outcome != RequestStatus.REJECTED) {
            execute(r, admin);
        }
        transition(r, outcome, admin, note.trim());
        r.setResolutionNote(note.trim());
        if (outcome == RequestStatus.REJECTED) {
            r.setRejectionReason(note.trim());
        }
        r.setResolvedAt(LocalDateTime.now());
        DataRequest saved = requests.save(r);
        audit.record(college, admin, r.getUserId(), "REQUEST_" + outcome, "requestId=" + requestId);
        return saved;
    }

    // ---------------------------------------------------------------- internals

    private void execute(DataRequest r, Integer admin) {
        switch (r.getType()) {
            case ACCESS -> r.setExportPayload(toJson(buildExport(r.getUserId())));
            case CORRECTION -> applyCorrection(r, admin);
            case ERASURE -> erasure.erase(r.getCollegeId(), r.getUserId(), admin, "requestId=" + r.getRequestId());
            case GRIEVANCE -> { /* answered through the resolution note only */ }
        }
    }

    private Map<String, Object> buildExport(Integer userId) {
        Map<String, Object> bundle = new LinkedHashMap<>();
        bundle.put("generatedAt", LocalDateTime.now().toString());
        for (PersonalDataContributor c : contributors) {
            Map<String, Object> data = c.export(userId);
            if (data != null && !data.isEmpty()) {
                bundle.put(c.section(), data);
            }
        }
        return bundle;
    }

    private void applyCorrection(DataRequest r, Integer admin) {
        Map<String, String> payload = fromJson(r.getCorrectionPayload());
        List<PersonalDataContributor> applicable = contributors.stream()
                .filter(c -> c.appliesTo(r.getUserId()))
                .toList();
        Set<String> unowned = new TreeSet<>();
        for (String key : payload.keySet()) {
            if (applicable.stream().noneMatch(c -> c.correctableFields().contains(key))) {
                unowned.add(key);
            }
        }
        if (!unowned.isEmpty()) {
            throw new BusinessRuleViolationException(
                    "Cannot apply correction for field(s): " + unowned + "; reject the request with a reason");
        }
        for (PersonalDataContributor c : applicable) {
            Map<String, String> mine = payload.entrySet().stream()
                    .filter(e -> c.correctableFields().contains(e.getKey()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
            if (!mine.isEmpty()) {
                c.correct(r.getUserId(), mine);
            }
        }
        // field names only: the new values are personal data and stay out of the audit trail
        audit.record(r.getCollegeId(), admin, r.getUserId(), "CORRECTION_APPLIED", "fields=" + new TreeSet<>(payload.keySet()));
    }

    private String validatedCorrection(Map<String, String> correction) {
        if (correction == null || correction.isEmpty()) {
            throw new BusinessRuleViolationException("Say which field to correct and the new value");
        }
        Integer self = tenant.userId();
        Set<String> allowed = contributors.stream()
                .filter(c -> c.appliesTo(self))
                .flatMap(c -> c.correctableFields().stream())
                .collect(Collectors.toSet());
        for (Map.Entry<String, String> e : correction.entrySet()) {
            if (!allowed.contains(e.getKey())) {
                throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
            if (e.getValue() == null || e.getValue().isBlank()) {
                throw new BusinessRuleViolationException("Value is required for " + e.getKey());
            }
        }
        return toJson(correction);
    }

    private void transition(DataRequest r, RequestStatus next, Integer actor, String note) {
        RequestStatus from = r.getStatus();
        if (!from.canTransitionTo(next)) {
            throw new BusinessRuleViolationException("Cannot move a request from " + from + " to " + next);
        }
        r.setStatus(next);
        recordEvent(r, from, next, actor, note);
    }

    private void recordEvent(DataRequest r, RequestStatus from, RequestStatus to, Integer actor, String note) {
        DataRequestEvent e = new DataRequestEvent();
        e.setRequestId(r.getRequestId());
        e.setFromStatus(from);
        e.setToStatus(to);
        e.setActorId(actor);
        e.setNote(note);
        events.save(e);
    }

    private void forbidSelfAction(DataRequest r, Integer actor) {
        if (r.getUserId().equals(actor)) {
            throw new BusinessRuleViolationException("You cannot act on your own request");
        }
    }

    private DataRequest load(Integer requestId, Integer college) {
        return requests.findByRequestIdAndCollegeId(requestId, college)
                .orElseThrow(() -> new ResourceNotFoundException("DataRequest", "id", requestId));
    }

    /** The request must exist in the caller's college and belong to the caller; anything else is "not found". */
    private DataRequest loadOwn(Integer requestId) {
        DataRequest r = load(requestId, tenant.collegeId());
        if (!r.getUserId().equals(tenant.userId())) {
            throw new ResourceNotFoundException("DataRequest", "id", requestId);
        }
        return r;
    }

    private DataRequestDetail detail(DataRequest r) {
        return new DataRequestDetail(DataRequestView.from(r), r.getCorrectionPayload(),
                events.findByRequestIdOrderByEventId(r.getRequestId()).stream().map(RequestEventView::from).toList());
    }

    private String toJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise privacy payload", e);
        }
    }

    private Map<String, String> fromJson(String json) {
        try {
            return mapper.readValue(json, new TypeReference<Map<String, String>>() { });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Stored correction payload is not valid JSON", e);
        }
    }
}
