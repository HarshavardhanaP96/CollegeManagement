// ============================================
// src/main/java/com/collegeManagement/entity/TeacherProfile.java
// ============================================

package com.edgepoint.teacher.domain;

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
@Table(name = "teacher_profiles")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TeacherProfile extends AuditableEntity {

    @Id
    @Column(name = "teacher_user_id")
    private Integer teacherUserId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "teacher_user_id")
    private User user;

    @Column(name = "employee_id", nullable = false, unique = true, length = 50)
    private String employeeId;

    @Column(name = "dept_id", nullable = false)
    private Integer deptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id", insertable = false, updatable = false)
    private Department department;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "specialization", length = 100)
    private String specialization;

    @Column(name = "qualification", length = 100)
    private String qualification;
}
