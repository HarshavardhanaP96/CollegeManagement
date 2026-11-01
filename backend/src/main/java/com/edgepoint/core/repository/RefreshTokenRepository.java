package com.edgepoint.core.repository;

import com.edgepoint.core.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Atomic: returns 1 only for the first caller, so two concurrent uses of one token can't both win. */
    @Transactional
    @Modifying
    @Query("UPDATE RefreshToken t SET t.revokedAt = :now WHERE t.tokenHash = :hash AND t.revokedAt IS NULL")
    int revokeIfActive(@Param("hash") String hash, @Param("now") LocalDateTime now);

    @Transactional
    @Modifying
    @Query("UPDATE RefreshToken t SET t.revokedAt = :now WHERE t.userId = :userId AND t.revokedAt IS NULL")
    int revokeAllForUser(@Param("userId") Integer userId, @Param("now") LocalDateTime now);
}
