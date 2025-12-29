// ============================================
// src/main/java/com/collegeManagement/entity/ExamType.java
// ============================================

package com.collegeManagement.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exam_type_id")
    private Integer examTypeId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", insertable = false, updatable = false)
    private College college;

    @Column(name = "exam_type_name", nullable = false, length = 50)
    private String examTypeName;

    @Column(name = "max_marks", nullable = false)
    private Integer maxMarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}