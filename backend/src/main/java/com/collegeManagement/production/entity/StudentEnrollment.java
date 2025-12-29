// ============================================
// src/main/java/com/collegeManagement/entity/StudentEnrollment.java
// ============================================

package com.collegeManagement.production.entity;

import com.collegeManagement.production.entity.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "student_enrollments")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class StudentEnrollment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "enrollment_id")
    private Integer enrollmentId;

    @Column(name = "student_user_id", nullable = false)
    private Integer studentUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id", insertable = false, updatable = false)
    private User student;

    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private Class classEntity;

    @Column(name = "enrollment_status", length = 20)
    private String enrollmentStatus = "Active";
}
