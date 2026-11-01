package com.edgepoint.knowledgebase.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.audit.repository.AuditLogRepository;
import com.edgepoint.core.domain.College;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.knowledgebase.domain.ArticleStatus;
import com.edgepoint.knowledgebase.dto.KbArticleDto;
import com.edgepoint.knowledgebase.dto.KbArticleRequest;
import com.edgepoint.knowledgebase.dto.KbCategoryRequest;
import com.edgepoint.knowledgebase.repository.KbArticleFeedbackRepository;
import com.edgepoint.knowledgebase.repository.KbArticleRepository;
import com.edgepoint.knowledgebase.repository.KbCategoryRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@ActiveProfiles("test")
@DisplayName("Knowledge base service")
class KnowledgeBaseServiceTest {

    private static final int AUTHOR = 1;
    private static final int READER = 42;
    private static final PageRequest PAGE = PageRequest.of(0, 20);

    @Autowired private KnowledgeBaseService service;
    @Autowired private KbCategoryRepository categoryRepository;
    @Autowired private KbArticleRepository articleRepository;
    @Autowired private KbArticleFeedbackRepository feedbackRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private CollegeRepository collegeRepository;
    @Autowired private TenantContext tenantContext;

    private Integer collegeId;
    private Long categoryId;

    @BeforeEach
    void setUp() {
        College college = new College();
        college.setCollegeName("KB Test College");
        college.setCollegeCode("KBT");
        collegeId = collegeRepository.save(college).getCollegeId();
        tenantContext.setContext(AUTHOR, collegeId, 1);
        categoryId = service.createCategory(category("Attendance", "attendance")).getId();
    }

    @AfterEach
    void tearDown() {
        tenantContext.clear();
        feedbackRepository.deleteAll();
        articleRepository.deleteAll();
        categoryRepository.deleteAll();
        auditLogRepository.deleteAll();
        collegeRepository.deleteAll();
    }

    private static KbCategoryRequest category(String name, String slug) {
        KbCategoryRequest r = new KbCategoryRequest();
        r.setName(name);
        r.setSlug(slug);
        r.setDisplayOrder(1);
        return r;
    }

    private KbArticleRequest article(String slug, ArticleStatus status, List<String> roles) {
        KbArticleRequest r = new KbArticleRequest();
        r.setCategoryId(categoryId);
        r.setTitle("How to " + slug);
        r.setSlug(slug);
        r.setBody("Body of " + slug);
        r.setStatus(status);
        r.setVisibleRoles(roles);
        return r;
    }

    private List<String> visibleSlugs(String role, String category, String q) {
        return service.searchPublished(role, category, q, PAGE).getContent().stream().map(KbArticleDto::getSlug).toList();
    }

    @Test
    @DisplayName("readers only ever see published articles")
    void readersSeePublishedOnly() {
        service.createArticle(article("published", ArticleStatus.PUBLISHED, null));
        service.createArticle(article("draft", ArticleStatus.DRAFT, null));
        service.createArticle(article("archived", ArticleStatus.ARCHIVED, null));

        assertThat(visibleSlugs("STUDENT", null, null)).containsExactly("published");
        assertThatThrownBy(() -> service.getPublished("STUDENT", "draft")).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.getPublished("STUDENT", "archived")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("visibleRoles restricts readers; empty means everyone; SUPERADMIN sees all")
    void roleVisibility() {
        service.createArticle(article("for-all", ArticleStatus.PUBLISHED, null));
        service.createArticle(article("for-teachers", ArticleStatus.PUBLISHED, List.of("TEACHER", "HOD")));

        assertThat(visibleSlugs("STUDENT", null, null)).containsExactly("for-all");
        assertThat(visibleSlugs("TEACHER", null, null)).containsExactlyInAnyOrder("for-all", "for-teachers");
        assertThat(visibleSlugs("HOD", null, null)).containsExactlyInAnyOrder("for-all", "for-teachers");
        assertThat(visibleSlugs("SUPERADMIN", null, null)).containsExactlyInAnyOrder("for-all", "for-teachers");
        assertThatThrownBy(() -> service.getPublished("STUDENT", "for-teachers"))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(service.getPublished("TEACHER", "for-teachers").getBody()).isEqualTo("Body of for-teachers");
    }

    @Test
    @DisplayName("search matches title or body case-insensitively and filters by category slug")
    void searchAndCategory() {
        Long other = service.createCategory(category("Exams", "exams")).getId();
        service.createArticle(article("mark-attendance", ArticleStatus.PUBLISHED, null));
        KbArticleRequest exam = article("exam-schedule", ArticleStatus.PUBLISHED, null);
        exam.setCategoryId(other);
        exam.setBody("Where to find the TIMETABLE");
        service.createArticle(exam);

        assertThat(visibleSlugs("STUDENT", null, "timetable")).containsExactly("exam-schedule");
        assertThat(visibleSlugs("STUDENT", null, "MARK-ATT")).containsExactly("mark-attendance");
        assertThat(visibleSlugs("STUDENT", "exams", null)).containsExactly("exam-schedule");
        assertThat(visibleSlugs("STUDENT", "no-such-category", null)).isEmpty();
        assertThat(service.searchPublished("STUDENT", null, null, PAGE).getContent())
                .allSatisfy(a -> assertThat(a.getBody()).isNull());
    }

    @Test
    @DisplayName("re-voting updates the caller's vote instead of adding another")
    void feedbackUpsert() {
        Long id = service.createArticle(article("vote-me", ArticleStatus.PUBLISHED, null)).getId();
        tenantContext.setContext(READER, collegeId, 5);

        service.vote("STUDENT", id, true);
        KbArticleDto after = service.vote("STUDENT", id, false);

        assertThat(feedbackRepository.count()).isEqualTo(1);
        assertThat(after.getHelpfulCount()).isZero();
        assertThat(after.getUnhelpfulCount()).isEqualTo(1);
        assertThat(after.getMyVote()).isFalse();
        assertThat(service.getPublished("STUDENT", "vote-me").getMyVote()).isFalse();
    }

    @Test
    @DisplayName("feedback on an article the reader cannot see is a 404")
    void feedbackOnHiddenArticle() {
        Long draft = service.createArticle(article("hidden", ArticleStatus.DRAFT, null)).getId();
        tenantContext.setContext(READER, collegeId, 5);

        assertThatThrownBy(() -> service.vote("STUDENT", draft, true)).isInstanceOf(ResourceNotFoundException.class);
        assertThat(feedbackRepository.count()).isZero();
    }

    @Test
    @DisplayName("publishing stamps publishedAt; drafts have none")
    void publishStampsDate() {
        KbArticleDto draft = service.createArticle(article("later", ArticleStatus.DRAFT, null));
        assertThat(draft.getPublishedAt()).isNull();

        KbArticleRequest publish = article("later", ArticleStatus.PUBLISHED, null);
        assertThat(service.updateArticle(draft.getId(), publish).getPublishedAt()).isNotNull();
    }

    @Test
    @DisplayName("slugs are unique and roles must be known")
    void validation() {
        service.createArticle(article("dup", ArticleStatus.DRAFT, null));
        assertThatThrownBy(() -> service.createArticle(article("dup", ArticleStatus.DRAFT, null)))
                .isInstanceOf(DuplicateResourceException.class);
        assertThatThrownBy(() -> service.createCategory(category("Again", "attendance")))
                .isInstanceOf(DuplicateResourceException.class);
        assertThatThrownBy(() -> service.createArticle(article("bad-role", ArticleStatus.DRAFT, List.of("JANITOR"))))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("a category with live articles cannot be deleted; a deleted article disappears")
    void deletes() {
        Long id = service.createArticle(article("gone", ArticleStatus.PUBLISHED, null)).getId();
        assertThatThrownBy(() -> service.deleteCategory(categoryId)).isInstanceOf(BusinessRuleViolationException.class);

        service.deleteArticle(id);

        assertThatThrownBy(() -> service.getPublished("STUDENT", "gone")).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.getArticle(id)).isInstanceOf(ResourceNotFoundException.class);
        service.deleteCategory(categoryId);
        assertThat(service.listCategories()).isEmpty();
    }

    @Test
    @DisplayName("article writes go through the existing audit trail")
    void writesAreAudited() {
        Long id = service.createArticle(article("audited", ArticleStatus.DRAFT, null)).getId();
        service.updateArticle(id, article("audited", ArticleStatus.PUBLISHED, null));
        service.deleteArticle(id);

        List<AuditLog> rows = auditLogRepository.findAll().stream()
                .filter(a -> "KbArticle".equals(a.getEntityType()) && String.valueOf(id).equals(a.getEntityId()))
                .toList();
        assertThat(rows).extracting(AuditLog::getAction)
                .containsExactlyInAnyOrder(AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE);
        assertThat(rows).allSatisfy(r -> assertThat(r.getActorUserId()).isEqualTo(AUTHOR));
    }
}
