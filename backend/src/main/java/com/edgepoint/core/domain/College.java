// ============================================
// src/main/java/com/collegeManagement/entity/College.java
// ============================================

package com.edgepoint.core.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "colleges")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class College extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "college_id")
    private Integer collegeId;

    @Column(name = "college_name", nullable = false)
    private String collegeName;

    @Column(name = "college_code", nullable = false, unique = true, length = 50)
    private String collegeCode;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;
}