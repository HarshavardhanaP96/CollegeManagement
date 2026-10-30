package com.edgepoint.audit.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.core.domain.AuditableEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.action.spi.AfterTransactionCompletionProcess;
import org.hibernate.action.spi.BeforeTransactionCompletionProcess;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventSource;
import org.hibernate.event.spi.EventType;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostInsertEventListener;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.event.spi.PostUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Captures create/update/delete of every AuditableEntity as it is flushed, so services
 * do not each need to remember to call the audit log. Entries are buffered per session and
 * inserted as one JDBC batch just before the business transaction commits, on its own
 * connection, so they commit or roll back with the change they describe.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventListener implements PostInsertEventListener, PostUpdateEventListener {

    private final EntityManagerFactory entityManagerFactory;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    private static final String INSERT_SQL = "INSERT INTO audit_log (college_id, actor_user_id, actor_username, "
            + "action, entity_type, entity_id, changes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    private final Map<SharedSessionContractImplementor, List<AuditLog>> pending = new ConcurrentHashMap<>();

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
        String[] names = event.getPersister().getPropertyNames();
        emit(event.getSession(), AuditAction.CREATE, event.getEntity(), event.getId(), AuditDiff.snapshot(names, event.getState()));
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        if (!(event.getEntity() instanceof AuditableEntity)) return;
        String[] names = event.getPersister().getPropertyNames();
        Object[] before = event.getOldState();
        Object[] after = event.getState();
        if (before == null) return;
        AuditAction action = AuditDiff.isSoftDelete(names, before, after) ? AuditAction.DELETE : AuditAction.UPDATE;
        var changes = AuditDiff.changes(names, before, after);
        if (changes.isEmpty()) return;
        emit(event.getSession(), action, event.getEntity(), event.getId(), changes);
    }

    private void emit(EventSource session, AuditAction action, Object entity, Object id, Object changes) {
        try {
            AuditLog entry = auditService.newEntry(action, entity.getClass().getSimpleName(),
                    id == null ? null : String.valueOf(id), objectMapper.writeValueAsString(changes));
            if (entry != null) {
                pendingFor(session).add(entry);
            }
        } catch (JsonProcessingException e) {
            log.warn("Could not serialise audit changes for {}", entity.getClass().getSimpleName(), e);
        }
    }

    private List<AuditLog> pendingFor(EventSource session) {
        return pending.computeIfAbsent(session, s -> {
            // Runs after Hibernate's final flush, so every change of the transaction is buffered by then.
            session.getActionQueue().registerProcess((BeforeTransactionCompletionProcess) this::flush);
            // Also runs on rollback, which skips the before-completion step: drop what was buffered.
            session.getActionQueue().registerProcess((AfterTransactionCompletionProcess) (ok, ss) -> pending.remove(ss));
            return new ArrayList<>();
        });
    }

    private void flush(SessionImplementor session) {
        List<AuditLog> entries = pending.remove(session);
        if (entries == null || entries.isEmpty()) return;
        try {
            session.doWork(connection -> writeBatch(connection, entries));
        } catch (RuntimeException e) {
            log.warn("Failed to write {} audit entries", entries.size(), e);
        }
    }

    /** Inserts all entries in one batch inside a savepoint; a failure is logged and never fails the commit. */
    static void writeBatch(Connection connection, List<AuditLog> entries) {
        Savepoint savepoint = null;
        try {
            savepoint = connection.setSavepoint();
            try (PreparedStatement ps = connection.prepareStatement(INSERT_SQL)) {
                for (AuditLog e : entries) {
                    ps.setInt(1, e.getCollegeId());
                    ps.setObject(2, e.getActorUserId(), Types.INTEGER);
                    ps.setString(3, e.getActorUsername());
                    ps.setString(4, e.getAction().name());
                    ps.setString(5, e.getEntityType());
                    ps.setString(6, e.getEntityId());
                    ps.setString(7, e.getChanges());
                    ps.setTimestamp(8, Timestamp.valueOf(e.getCreatedAt()));
                    ps.addBatch();
                }
                ps.executeBatch();
            }
            connection.releaseSavepoint(savepoint);
        } catch (SQLException e) {
            log.warn("Failed to write {} audit entries", entries.size(), e);
            if (savepoint != null) {
                try {
                    connection.rollback(savepoint);
                } catch (SQLException rollbackFailure) {
                    log.warn("Could not roll back failed audit batch", rollbackFailure);
                }
            }
        }
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }
}
