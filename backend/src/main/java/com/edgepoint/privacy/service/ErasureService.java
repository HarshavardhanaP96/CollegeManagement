package com.edgepoint.privacy.service;

import com.edgepoint.privacy.contributor.PersonalDataContributor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Anonymises a user across every module in one transaction; academic records stay, linked by user id. */
@Service
@RequiredArgsConstructor
public class ErasureService {

    private final List<PersonalDataContributor> contributors;
    private final PrivacyAuditService audit;

    @Transactional
    public void erase(Integer collegeId, Integer userId, Integer actorId, String reason) {
        for (PersonalDataContributor contributor : contributors) {
            contributor.anonymise(userId);
        }
        audit.record(collegeId, actorId, userId, "ERASURE_EXECUTED", reason);
    }
}
