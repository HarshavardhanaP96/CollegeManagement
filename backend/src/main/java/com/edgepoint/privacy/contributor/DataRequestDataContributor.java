package com.edgepoint.privacy.contributor;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.DataRequestEvent;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;
import com.edgepoint.privacy.repository.DataRequestEventRepository;
import com.edgepoint.privacy.repository.DataRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Scrubs the free text and data bundles stored on a user's own privacy requests when they are erased. */
@Component
@RequiredArgsConstructor
public class DataRequestDataContributor implements PersonalDataContributor {

    static final String CLOSED_NOTE = "Closed automatically: the account was erased";

    private final DataRequestRepository requests;
    private final DataRequestEventRepository events;

    @Override
    public String section() {
        return "requests";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        return Map.of();
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of();
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        // request rows are not self-correctable
    }

    @Override
    public boolean appliesTo(Integer userId) {
        return false;
    }

    @Override
    public void anonymise(Integer userId) {
        List<DataRequest> mine = requests.findByUserIdOrderBySubmittedAtDesc(userId);
        if (mine.isEmpty()) {
            return;
        }
        for (DataRequest r : mine) {
            r.setDetails(null);
            r.setCorrectionPayload(null);
            r.setExportPayload(null);
            // the ERASURE request being resolved is left to its own transition
            if (r.getType() != RequestType.ERASURE && RequestStatus.OPEN.contains(r.getStatus())) {
                close(r);
            }
        }
        requests.saveAll(mine);
    }

    private void close(DataRequest r) {
        RequestStatus from = r.getStatus();
        r.setStatus(RequestStatus.REJECTED);
        r.setResolutionNote(CLOSED_NOTE);
        r.setRejectionReason(CLOSED_NOTE);
        r.setResolvedAt(LocalDateTime.now());
        DataRequestEvent e = new DataRequestEvent();
        e.setRequestId(r.getRequestId());
        e.setFromStatus(from);
        e.setToStatus(RequestStatus.REJECTED);
        e.setActorId(null);
        e.setNote(CLOSED_NOTE);
        events.save(e);
    }
}
