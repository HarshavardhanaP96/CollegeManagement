// src/main/java/com/collegeManagement/repository/StudentProfileRepository.java
package com.edgepoint.student.repository;

import com.edgepoint.student.domain.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Integer> {

    Optional<StudentProfile> findByStudentUserIdAndIsDeletedFalse(Integer studentUserId);

    boolean existsByRollNumberAndIsDeletedFalse(String rollNumber);

    @Query("SELECT sp FROM StudentProfile sp WHERE sp.deptId = :deptId " +
            "AND sp.currentSemester = :semester AND sp.isDeleted = false")
    List<StudentProfile> findByDeptAndSemester(@Param("deptId") Integer deptId,
                                               @Param("semester") Integer semester);
}