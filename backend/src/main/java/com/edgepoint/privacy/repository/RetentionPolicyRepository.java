package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.RetentionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RetentionPolicyRepository extends JpaRepository<RetentionPolicy, Integer> {
    List<RetentionPolicy> findByCollegeId(Integer collegeId);
    List<RetentionPolicy> findByCollegeIdAndEnabledTrue(Integer collegeId);
    Optional<RetentionPolicy> findByCollegeIdAndDataCategory(Integer collegeId, String dataCategory);
}
