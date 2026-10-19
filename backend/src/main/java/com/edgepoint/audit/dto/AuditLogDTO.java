package com.edgepoint.audit.dto;

import com.edgepoint.audit.domain.AuditLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogDTO {
    private Long id;
    private Integer collegeId;
    private Integer actorUserId;
    private String actorUsername;
    private String action;
    private String entityType;
    private String entityId;
    private String changes;
    private LocalDateTime createdAt;

    public static AuditLogDTO from(AuditLog a) {
        return AuditLogDTO.builder()
                .id(a.getId())
                .collegeId(a.getCollegeId())
                .actorUserId(a.getActorUserId())
                .actorUsername(a.getActorUsername())
                .action(a.getAction().name())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .changes(a.getChanges())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
