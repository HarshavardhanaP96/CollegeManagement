package com.edgepoint.privacy.contributor;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.repository.DataRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** Scrubs the free text and data bundles stored on a user's own privacy requests when they are erased. */
@Component
@RequiredArgsConstructor
public class DataRequestDataContributor implements PersonalDataContributor {

    private final DataRequestRepository requests;

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
        }
        requests.saveAll(mine);
    }
}
