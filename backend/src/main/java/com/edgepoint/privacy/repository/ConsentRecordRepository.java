package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Integer> {
    List<ConsentRecord> findByUserId(Integer userId);
    Optional<ConsentRecord> findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(Integer userId, Integer purposeId);
}
