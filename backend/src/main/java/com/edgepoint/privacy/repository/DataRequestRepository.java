package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DataRequestRepository extends JpaRepository<DataRequest, Integer> {
    Optional<DataRequest> findByRequestIdAndCollegeId(Integer requestId, Integer collegeId);
    List<DataRequest> findByUserIdOrderBySubmittedAtDesc(Integer userId);
    boolean existsByUserIdAndTypeAndStatusIn(Integer userId, RequestType type, Collection<RequestStatus> statuses);
    Page<DataRequest> findByCollegeId(Integer collegeId, Pageable pageable);
    Page<DataRequest> findByCollegeIdAndStatus(Integer collegeId, RequestStatus status, Pageable pageable);
    Page<DataRequest> findByCollegeIdAndStatusInAndDueAtBefore(Integer collegeId, Collection<RequestStatus> statuses,
                                                               LocalDateTime before, Pageable pageable);
}
