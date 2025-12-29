// src/main/java/com/collegeManagement/repository/AttendanceRecordRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Integer> {

    Optional<AttendanceRecord> findByAttendanceIdAndIsDeletedFalse(Integer attendanceId);

    @Query("SELECT ar FROM AttendanceRecord ar WHERE ar.assignmentId = :assignmentId " +
            "AND ar.isDeleted = false")
    List<AttendanceRecord> findByAssignmentId(@Param("assignmentId") Integer assignmentId);

    @Query("SELECT ar FROM AttendanceRecord ar WHERE ar.assignmentId = :assignmentId " +
            "AND ar.recordDate BETWEEN :startDate AND :endDate AND ar.isDeleted = false")
    List<AttendanceRecord> findByAssignmentIdAndDateRange(
            @Param("assignmentId") Integer assignmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT ar FROM AttendanceRecord ar WHERE ar.studentUserId = :studentId " +
            "AND ar.isDeleted = false")
    List<AttendanceRecord> findByStudentId(@Param("studentId") Integer studentId);

    boolean existsByAssignmentIdAndStudentUserIdAndRecordDateAndIsDeletedFalse(
            Integer assignmentId, Integer studentUserId, LocalDate recordDate);
}