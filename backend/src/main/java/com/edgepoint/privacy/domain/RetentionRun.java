package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "retention_runs")
@Data
@NoArgsConstructor
public class RetentionRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "run_id")
    private Integer runId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "dry_run", nullable = false)
    private boolean dryRun;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RetentionRunStatus status = RetentionRunStatus.RUNNING;

    @Column(name = "records_processed", nullable = false)
    private int recordsProcessed;

    @Column(name = "records_failed", nullable = false)
    private int recordsFailed;
}
