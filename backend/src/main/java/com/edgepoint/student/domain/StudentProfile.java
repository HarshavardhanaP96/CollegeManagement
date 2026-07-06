// ============================================
// src/main/java/com/collegeManagement/entity/StudentProfile.java
// ============================================

package com.edgepoint.student.domain;

import com.edgepoint.academic.domain.Course;
import com.edgepoint.academic.domain.Department;
import com.edgepoint.core.domain.User;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "student_profiles")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile extends AuditableEntity {

    @Id
    @Column(name = "student_user_id")
    private Integer studentUserId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "student_user_id")
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true, length = 50)
    private String rollNumber;

    @Column(name = "dept_id", nullable = false)
    private Integer deptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id", insertable = false, updatable = false)
    private Department department;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;

    @Column(name = "admission_year", nullable = false)
    private Integer admissionYear;

    @Column(name = "current_semester", nullable = false)
    private Integer currentSemester = 1;

    @Column(name = "parent_name")
    private String parentName;

    @Column(name = "parent_phone", nullable = false, length = 20)
    private String parentPhone;

    @Column(name = "parent_email")
    private String parentEmail;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;
}