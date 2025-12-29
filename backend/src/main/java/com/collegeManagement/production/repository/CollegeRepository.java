// src/main/java/com/collegeManagement/repository/CollegeRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.College;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CollegeRepository extends JpaRepository<College, Integer> {

    Optional<College> findByCollegeIdAndIsDeletedFalse(Integer collegeId);

    boolean existsByCollegeCodeAndIsDeletedFalse(String collegeCode);

    @Query("SELECT c FROM College c WHERE c.isDeleted = false")
    Page<College> findAllActive(Pageable pageable);

    @Query("SELECT c FROM College c WHERE c.isDeleted = false AND " +
            "(LOWER(c.collegeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.collegeCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<College> searchColleges(@Param("search") String search, Pageable pageable);
}