// ============================================
// src/main/java/com/collegeManagement/entity/Department.java
// ============================================

package com.collegeManagement.production.entity;

import com.collegeManagement.production.entity.base.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "departments")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Department extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dept_id")
    private Integer deptId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", insertable = false, updatable = false)
    private College college;

    @Column(name = "dept_name", nullable = false, length = 100)
    private String deptName;

    @Column(name = "dept_code", nullable = false, length = 20)
    private String deptCode;

    @Column(name = "dept_head_user_id")
    private Integer deptHeadUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_head_user_id", insertable = false, updatable = false)
    private User deptHead;
}