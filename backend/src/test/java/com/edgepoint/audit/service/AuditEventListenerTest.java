package com.edgepoint.audit.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@DisplayName("AuditEventListener batch write")
class AuditEventListenerTest {

    private static AuditLog entry() {
        AuditLog e = new AuditLog();
        e.setCollegeId(7);
        e.setAction(AuditAction.CREATE);
        e.setEntityType("Attendance");
        e.setEntityId("1");
        e.setCreatedAt(LocalDateTime.now());
        return e;
    }

    @Test
    @DisplayName("all entries go out as one JDBC batch inside a savepoint")
    void writesOneBatch() throws SQLException {
        Connection connection = mock(Connection.class);
        PreparedStatement statement = mock(PreparedStatement.class);
        Savepoint savepoint = mock(Savepoint.class);
        when(connection.setSavepoint()).thenReturn(savepoint);
        when(connection.prepareStatement(anyString())).thenReturn(statement);

        AuditEventListener.writeBatch(connection, List.of(entry(), entry(), entry()));

        verify(statement, times(3)).addBatch();
        verify(statement, times(1)).executeBatch();
        verify(connection).releaseSavepoint(savepoint);
        verify(connection, never()).rollback(savepoint);
    }

    @Test
    @DisplayName("a failed audit insert rolls back to its savepoint and never throws into the business commit")
    void failureIsContained() throws SQLException {
        Connection connection = mock(Connection.class);
        PreparedStatement statement = mock(PreparedStatement.class);
        Savepoint savepoint = mock(Savepoint.class);
        when(connection.setSavepoint()).thenReturn(savepoint);
        when(connection.prepareStatement(anyString())).thenReturn(statement);
        when(statement.executeBatch()).thenThrow(new SQLException("boom"));

        assertThatCode(() -> AuditEventListener.writeBatch(connection, List.of(entry()))).doesNotThrowAnyException();

        verify(connection).rollback(savepoint);
    }
}
