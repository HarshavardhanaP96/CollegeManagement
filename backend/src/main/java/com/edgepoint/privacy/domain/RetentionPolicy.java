package com.edgepoint.privacy.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "retention_policies",
        uniqueConstraints = @UniqueConstraint(name = "uq_retention_policies_college_category", columnNames = {"college_id", "data_category"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class RetentionPolicy extends AuditableEntity {

    public static final String ACCOUNT_RECORDS = "ACCOUNT_RECORDS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "policy_id")
    private Integer policyId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "data_category", nullable = false, length = 50)
    private String dataCategory;

    @Column(name = "retention_days", nullable = false)
    private int retentionDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_event", nullable = false, length = 30)
    private RetentionTrigger triggerEvent = RetentionTrigger.ACCOUNT_DEACTIVATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private RetentionAction action = RetentionAction.ANONYMISE;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = false;
}
