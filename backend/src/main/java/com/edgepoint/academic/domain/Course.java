// ============================================
// src/main/java/com/collegeManagement/entity/Course.java
// ============================================

package com.edgepoint.academic.domain;

import com.edgepoint.core.domain.College;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "courses")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Course extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", insertable = false, updatable = false)
    private College college;

    @Column(name = "course_name", nullable = false, length = 100)
    private String courseName;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "duration_years", nullable = false)
    private Integer durationYears = 4;

    @Column(name = "total_semesters", nullable = false)
    private Integer totalSemesters = 8;
}
