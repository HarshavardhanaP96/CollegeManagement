// ============================================
// src/main/java/com/collegeManagement/entity/Marks.java
// ============================================

package com.collegeManagement.production.entity;

import com.collegeManagement.production.entity.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "marks")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Mark extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mark_id")
    private Integer markId;

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

    @Column(name = "exam_type_id", nullable = false)
    private Integer examTypeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_type_id", insertable = false, updatable = false)
    private ExamType examType;

    @Column(name = "marks_obtained", nullable = false, precision = 5, scale = 2)
    private BigDecimal marksObtained;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
