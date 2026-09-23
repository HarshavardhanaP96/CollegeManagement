package com.edgepoint.notification.repository;

import com.edgepoint.notification.domain.NotificationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, Long> {

    Optional<NotificationConfig> findByCollegeId(Integer collegeId);
}
