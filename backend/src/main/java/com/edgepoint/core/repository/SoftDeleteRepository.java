// src/main/java/com/collegeManagement/repository/base/SoftDeleteRepository.java
package com.edgepoint.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@NoRepositoryBean
public interface SoftDeleteRepository<T, ID> extends JpaRepository<T, ID> {

    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false")
    List<T> findAllActive();

    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false")
    Optional<T> findByIdActive(@Param("id") ID id);

    @Modifying
    @Query("UPDATE #{#entityName} e SET e.isDeleted = true, e.deletedAt = :deletedAt, " +
            "e.deletedBy = :deletedBy WHERE e.id = :id")
    void softDelete(@Param("id") ID id,
                    @Param("deletedAt") LocalDateTime deletedAt,
                    @Param("deletedBy") Integer deletedBy);
}