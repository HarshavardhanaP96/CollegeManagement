package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.DataRequestEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DataRequestEventRepository extends JpaRepository<DataRequestEvent, Integer> {
    List<DataRequestEvent> findByRequestIdOrderByEventId(Integer requestId);
}
