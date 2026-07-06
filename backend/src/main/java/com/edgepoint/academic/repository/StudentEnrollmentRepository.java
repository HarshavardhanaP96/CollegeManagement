// src/main/java/com/collegeManagement/repository/StudentEnrollmentRepository.java
package com.edgepoint.academic.repository;

import com.edgepoint.academic.domain.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, Integer> {

    @Query("SELECT se FROM StudentEnrollment se WHERE se.classId = :classId " +
            "AND se.enrollmentStatus = 'Active' AND se.isDeleted = false")
    List<StudentEnrollment> findActiveByClassId(@Param("classId") Integer classId);

    @Query("SELECT se FROM StudentEnrollment se WHERE se.studentUserId = :studentId " +
            "AND se.enrollmentStatus = 'Active' AND se.isDeleted = false")
    List<StudentEnrollment> findActiveByStudentId(@Param("studentId") Integer studentId);

    boolean existsByStudentUserIdAndClassIdAndEnrollmentStatusAndIsDeletedFalse(
            Integer studentUserId, Integer classId, String enrollmentStatus);
}