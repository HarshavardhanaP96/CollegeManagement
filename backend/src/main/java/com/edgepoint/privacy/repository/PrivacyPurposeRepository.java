package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.PrivacyPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrivacyPurposeRepository extends JpaRepository<PrivacyPurpose, Integer> {
    List<PrivacyPurpose> findByCollegeIdAndActiveTrueOrderByPurposeId(Integer collegeId);
    Optional<PrivacyPurpose> findByPurposeIdAndCollegeId(Integer purposeId, Integer collegeId);
    long countByCollegeId(Integer collegeId);
}
