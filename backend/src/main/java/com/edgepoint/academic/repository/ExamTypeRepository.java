// src/main/java/com/collegeManagement/repository/ExamTypeRepository.java
package com.edgepoint.academic.repository;

import com.edgepoint.academic.domain.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamTypeRepository extends JpaRepository<ExamType, Integer> {

    @Query("SELECT et FROM ExamType et WHERE et.collegeId = :collegeId")
    List<ExamType> findByCollegeId(@Param("collegeId") Integer collegeId);
}
