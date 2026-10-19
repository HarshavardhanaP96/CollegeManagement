package com.edgepoint.privacy.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "privacy_purposes",
        uniqueConstraints = @UniqueConstraint(name = "uq_privacy_purposes_college_code", columnNames = {"college_id", "code"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PrivacyPurpose extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purpose_id")
    private Integer purposeId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false, length = 20)
    private LegalBasis legalBasis;

    @Column(name = "withdrawable", nullable = false)
    private boolean withdrawable = true;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
