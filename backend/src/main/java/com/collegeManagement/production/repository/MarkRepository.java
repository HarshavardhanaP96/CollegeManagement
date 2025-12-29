// src/main/java/com/collegeManagement/repository/MarksRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarkRepository extends JpaRepository<Mark, Integer> {

    Optional<Mark> findByMarkIdAndIsDeletedFalse(Integer markId);

    @Query("SELECT m FROM Mark m WHERE m.assignmentId = :assignmentId AND m.isDeleted = false")
    List<Mark> findByAssignmentId(@Param("assignmentId") Integer assignmentId);

    @Query("SELECT m FROM Mark m WHERE m.assignmentId = :assignmentId " +
            "AND m.examTypeId = :examTypeId AND m.isDeleted = false")
    List<Mark> findByAssignmentIdAndExamTypeId(@Param("assignmentId") Integer assignmentId,
                                                @Param("examTypeId") Integer examTypeId);

    @Query("SELECT m FROM Mark m WHERE m.studentUserId = :studentId AND m.isDeleted = false")
    List<Mark> findByStudentId(@Param("studentId") Integer studentId);

    boolean existsByAssignmentIdAndStudentUserIdAndExamTypeIdAndIsDeletedFalse(
            Integer assignmentId, Integer studentUserId, Integer examTypeId);
}