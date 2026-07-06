// ============================================
// src/main/java/com/collegeManagement/entity/AttendanceRecord.java
// ============================================

package com.edgepoint.attendance.domain;

import com.edgepoint.academic.domain.TeacherAssignment;
import com.edgepoint.core.domain.User;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "attendance_records")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Integer attendanceId;

    @Column(name = "assignment_id", nullable = false)
    private Integer assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", insertable = false, updatable = false)
    private TeacherAssignment assignment;

    @Column(name = "student_user_id", nullable = false)
    private Integer studentUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id", insertable = false, updatable = false)
    private User student;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "is_present", nullable = false)
    private Boolean isPresent;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}