package com.edgepoint.audit.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.core.domain.AuditableEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostInsertEventListener;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.event.spi.PostUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.stereotype.Component;

/**
 * Captures create/update/delete of every AuditableEntity as it is flushed, so services
 * do not each need to remember to call the audit log.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventListener implements PostInsertEventListener, PostUpdateEventListener {

    private final EntityManagerFactory entityManagerFactory;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @PostConstruct
    void register() {
        EventListenerRegistry registry = entityManagerFactory.unwrap(SessionFactoryImplementor.class)
                .getServiceRegistry().getService(EventListenerRegistry.class);
        registry.appendListeners(EventType.POST_INSERT, this);
        registry.appendListeners(EventType.POST_UPDATE, this);
    }

    @Override
    public void onPostInsert(PostInsertEvent event) {
        if (!(event.getEntity() instanceof AuditableEntity)) return;
        String type = event.getEntity().getClass().getSimpleName();
        if (AuditDiff.isExcluded(type)) return;
        String[] names = event.getPersister().getPropertyNames();
        emit(AuditAction.CREATE, event.getEntity(), event.getId(), AuditDiff.snapshot(type, names, event.getState()));
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        if (!(event.getEntity() instanceof AuditableEntity)) return;
        String type = event.getEntity().getClass().getSimpleName();
        if (AuditDiff.isExcluded(type)) return;
        String[] names = event.getPersister().getPropertyNames();
        Object[] before = event.getOldState();
        Object[] after = event.getState();
        if (before == null) return;
        AuditAction action = AuditDiff.isSoftDelete(names, before, after) ? AuditAction.DELETE : AuditAction.UPDATE;
        var changes = AuditDiff.changes(type, names, before, after);
        if (changes.isEmpty()) return;
        emit(action, event.getEntity(), event.getId(), changes);
    }

    private void emit(AuditAction action, Object entity, Object id, Object changes) {
        try {
            auditService.record(action, entity.getClass().getSimpleName(),
                    id == null ? null : String.valueOf(id), objectMapper.writeValueAsString(changes));
        } catch (JsonProcessingException e) {
            log.warn("Could not serialise audit changes for {}", entity.getClass().getSimpleName(), e);
        }
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }
}
