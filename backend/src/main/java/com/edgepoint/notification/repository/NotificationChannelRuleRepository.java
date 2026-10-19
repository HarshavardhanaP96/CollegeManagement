package com.edgepoint.notification.repository;

import com.edgepoint.notification.domain.NotificationChannelRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationChannelRuleRepository extends JpaRepository<NotificationChannelRule, Long> {

    List<NotificationChannelRule> findByCollegeId(Integer collegeId);
}
