// src/main/java/com/collegeManagement/repository/TeacherAssignmentRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.TeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Integer> {

    Optional<TeacherAssignment> findByAssignmentIdAndIsDeletedFalse(Integer assignmentId);

    @Query("SELECT ta FROM TeacherAssignment ta WHERE ta.teacherUserId = :teacherId " +
            "AND ta.isActive = true AND ta.isDeleted = false")
    List<TeacherAssignment> findActiveByTeacherId(@Param("teacherId") Integer teacherId);

    @Query("SELECT ta FROM TeacherAssignment ta WHERE ta.classSubjectId = :classSubjectId " +
            "AND ta.isActive = true AND ta.isDeleted = false")
    List<TeacherAssignment> findActiveByClassSubjectId(@Param("classSubjectId") Integer classSubjectId);

    boolean existsByClassSubjectIdAndTeacherUserIdAndIsActiveTrueAndIsDeletedFalse(
            Integer classSubjectId, Integer teacherUserId);
}
