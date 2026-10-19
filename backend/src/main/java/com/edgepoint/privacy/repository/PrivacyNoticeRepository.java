package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.PrivacyNotice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrivacyNoticeRepository extends JpaRepository<PrivacyNotice, Integer> {
    Optional<PrivacyNotice> findFirstByCollegeIdOrderByVersionDesc(Integer collegeId);
    List<PrivacyNotice> findByCollegeIdOrderByVersionDesc(Integer collegeId);
}
