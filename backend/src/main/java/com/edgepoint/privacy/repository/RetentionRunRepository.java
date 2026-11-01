package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.RetentionRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RetentionRunRepository extends JpaRepository<RetentionRun, Integer> {
    Page<RetentionRun> findByCollegeIdOrderByRunIdDesc(Integer collegeId, Pageable pageable);
}
