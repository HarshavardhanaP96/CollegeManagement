// ============================================
// src/main/java/com/collegeManagement/entity/TeacherAssignment.java
// ============================================

package com.edgepoint.academic.domain;

import com.edgepoint.core.domain.User;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "teacher_assignments")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAssignment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Integer assignmentId;

    @Column(name = "class_subject_id", nullable = false)
    private Integer classSubjectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id", insertable = false, updatable = false)
    private ClassSubject classSubject;

    @Column(name = "teacher_user_id", nullable = false)
    private Integer teacherUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_user_id", insertable = false, updatable = false)
    private User teacher;

    @Column(name = "is_active")
    private Boolean isActive = true;
}