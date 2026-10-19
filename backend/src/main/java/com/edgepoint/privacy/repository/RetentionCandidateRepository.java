package com.edgepoint.privacy.repository;

import com.edgepoint.core.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/** Read-only view over users used by the retention job; kept out of UserRepository to leave core untouched. */
public interface RetentionCandidateRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u WHERE u.collegeId = :collegeId AND u.isActive = false " +
            "AND u.anonymisedAt IS NULL AND u.role.roleName IN :roleNames " +
            "AND COALESCE(u.deletedAt, u.updatedAt, u.createdAt) < :cutoff")
    List<User> findExpiredInactive(@Param("collegeId") Integer collegeId,
                                   @Param("cutoff") LocalDateTime cutoff,
                                   @Param("roleNames") List<String> roleNames);
}
