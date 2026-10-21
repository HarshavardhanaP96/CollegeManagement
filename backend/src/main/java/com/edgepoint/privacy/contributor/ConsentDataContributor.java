package com.edgepoint.privacy.contributor;

import com.edgepoint.privacy.domain.ConsentRecord;
import com.edgepoint.privacy.repository.ConsentRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** Drops the source IP from a user's consent ledger rows on erasure; the consent facts themselves are kept. */
@Component
@RequiredArgsConstructor
public class ConsentDataContributor implements PersonalDataContributor {

    private final ConsentRecordRepository consents;

    @Override
    public String section() {
        return "consents";
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
        // consent rows are append-only
    }

    @Override
    public boolean appliesTo(Integer userId) {
        return false;
    }

    @Override
    public void anonymise(Integer userId) {
        List<ConsentRecord> rows = consents.findByUserId(userId);
        if (rows.isEmpty()) {
            return;
        }
        rows.forEach(r -> r.setSourceIp(null));
        consents.saveAll(rows);
    }
}
