// ============================================
// src/main/java/com/collegeManagement/entity/ClassSubject.java
// ============================================

package com.edgepoint.academic.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "class_subjects")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ClassSubject extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "class_subject_id")
    private Integer classSubjectId;

    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private AcademicClass classEntity;

    @Column(name = "subject_id", nullable = false)
    private Integer subjectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", insertable = false, updatable = false)
    private Subject subject;
}