package com.edgepoint.knowledgebase.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Global (not per-college) grouping of help articles. */
@Entity
@Table(name = "kb_categories")
@Getter
@Setter
@NoArgsConstructor
public class KbCategory extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "slug", nullable = false, length = 100)
    private String slug;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;
}
