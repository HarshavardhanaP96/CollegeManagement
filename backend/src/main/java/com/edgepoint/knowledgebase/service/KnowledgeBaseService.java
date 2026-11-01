package com.edgepoint.knowledgebase.service;

import com.edgepoint.core.domain.AuditableEntity;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.exception.UnauthorizedException;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.knowledgebase.domain.ArticleStatus;
import com.edgepoint.knowledgebase.domain.KbArticle;
import com.edgepoint.knowledgebase.domain.KbArticleFeedback;
import com.edgepoint.knowledgebase.domain.KbCategory;
import com.edgepoint.knowledgebase.dto.KbArticleDto;
import com.edgepoint.knowledgebase.dto.KbArticleRequest;
import com.edgepoint.knowledgebase.dto.KbCategoryDto;
import com.edgepoint.knowledgebase.dto.KbCategoryRequest;
import com.edgepoint.knowledgebase.repository.KbArticleFeedbackRepository;
import com.edgepoint.knowledgebase.repository.KbArticleRepository;
import com.edgepoint.knowledgebase.repository.KbCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Global help articles. Readers (any role) see PUBLISHED articles their role may see;
 * SUPERADMIN authors everything (enforced on the admin controller) and reads without the role filter.
 * Writes are audited by AuditEventListener because the entities extend AuditableEntity.
 */
@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private static final String SUPERADMIN = "SUPERADMIN";
    private static final Set<String> ROLES = Set.of(SUPERADMIN, "COLLEGEADMIN", "HOD", "TEACHER", "STUDENT");

    private final KbCategoryRepository categoryRepository;
    private final KbArticleRepository articleRepository;
    private final KbArticleFeedbackRepository feedbackRepository;
    private final TenantContext tenantContext;

    // ---- reader ----

    @Transactional(readOnly = true)
    public List<KbCategoryDto> listCategories() {
        return categoryRepository.findByIsDeletedFalseOrderByDisplayOrderAscNameAsc().stream()
                .map(KbCategoryDto::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<KbArticleDto> searchPublished(String role, String categorySlug, String q, Pageable pageable) {
        Long categoryId = null;
        if (categorySlug != null && !categorySlug.isBlank()) {
            var category = categoryRepository.findBySlugAndIsDeletedFalse(categorySlug);
            if (category.isEmpty()) return Page.empty(pageable);
            categoryId = category.get().getId();
        }
        Pageable byTitle = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("title", "id"));
        return articleRepository.search(ArticleStatus.PUBLISHED, categoryId, roleFilter(role), q, byTitle)
                .map(KbArticleDto::summary);
    }

    @Transactional(readOnly = true)
    public KbArticleDto getPublished(String role, String slug) {
        KbArticle article = articleRepository.findBySlugAndIsDeletedFalse(slug)
                .filter(a -> isReadable(a, role))
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + slug));
        KbArticleDto dto = KbArticleDto.full(article);
        Integer userId = tenantContext.getCurrentUserId();
        if (userId != null) {
            feedbackRepository.findByArticleIdAndUserId(article.getId(), userId)
                    .ifPresent(f -> dto.setMyVote(f.getHelpful()));
        }
        return dto;
    }

    /** Upserts the caller's vote, then recounts so the counters can't drift. */
    @Transactional
    public KbArticleDto vote(String role, Long articleId, boolean helpful) {
        Integer userId = tenantContext.getCurrentUserId();
        if (userId == null) throw new UnauthorizedException("No authenticated user");
        KbArticle article = articleRepository.findByIdAndIsDeletedFalse(articleId)
                .filter(a -> isReadable(a, role))
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + articleId));

        KbArticleFeedback vote = feedbackRepository.findByArticleIdAndUserId(articleId, userId).orElseGet(() -> {
            KbArticleFeedback f = new KbArticleFeedback();
            f.setArticleId(articleId);
            f.setUserId(userId);
            return f;
        });
        vote.setHelpful(helpful);
        feedbackRepository.saveAndFlush(vote);

        int up = (int) feedbackRepository.countByArticleIdAndHelpful(articleId, true);
        int down = (int) feedbackRepository.countByArticleIdAndHelpful(articleId, false);
        articleRepository.updateCounts(articleId, up, down);

        KbArticleDto dto = KbArticleDto.summary(article);
        dto.setHelpfulCount(up);
        dto.setUnhelpfulCount(down);
        dto.setMyVote(helpful);
        return dto;
    }

    // ---- admin (SUPERADMIN) ----

    @Transactional(readOnly = true)
    public Page<KbArticleDto> searchAll(String q, ArticleStatus status, Pageable pageable) {
        Pageable newest = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "id"));
        return articleRepository.search(status, null, null, q, newest).map(KbArticleDto::summary);
    }

    @Transactional(readOnly = true)
    public KbArticleDto getArticle(Long id) {
        return KbArticleDto.full(findArticle(id));
    }

    @Transactional
    public KbArticleDto createArticle(KbArticleRequest req) {
        if (articleRepository.existsBySlugAndIsDeletedFalse(req.getSlug())) {
            throw new DuplicateResourceException("An article with slug '" + req.getSlug() + "' already exists");
        }
        KbArticle article = new KbArticle();
        article.setCreatedBy(tenantContext.getCurrentUserId());
        apply(article, req);
        return KbArticleDto.full(articleRepository.save(article));
    }

    @Transactional
    public KbArticleDto updateArticle(Long id, KbArticleRequest req) {
        KbArticle article = findArticle(id);
        if (!article.getSlug().equals(req.getSlug()) && articleRepository.existsBySlugAndIsDeletedFalse(req.getSlug())) {
            throw new DuplicateResourceException("An article with slug '" + req.getSlug() + "' already exists");
        }
        article.setUpdatedBy(tenantContext.getCurrentUserId());
        apply(article, req);
        return KbArticleDto.full(articleRepository.saveAndFlush(article));
    }

    @Transactional
    public void deleteArticle(Long id) {
        KbArticle article = findArticle(id);
        softDelete(article);
        articleRepository.saveAndFlush(article);
    }

    @Transactional
    public KbCategoryDto createCategory(KbCategoryRequest req) {
        if (categoryRepository.existsBySlugAndIsDeletedFalse(req.getSlug())) {
            throw new DuplicateResourceException("A category with slug '" + req.getSlug() + "' already exists");
        }
        KbCategory category = new KbCategory();
        category.setCreatedBy(tenantContext.getCurrentUserId());
        apply(category, req);
        return KbCategoryDto.from(categoryRepository.save(category));
    }

    @Transactional
    public KbCategoryDto updateCategory(Long id, KbCategoryRequest req) {
        KbCategory category = findCategory(id);
        if (!category.getSlug().equals(req.getSlug()) && categoryRepository.existsBySlugAndIsDeletedFalse(req.getSlug())) {
            throw new DuplicateResourceException("A category with slug '" + req.getSlug() + "' already exists");
        }
        category.setUpdatedBy(tenantContext.getCurrentUserId());
        apply(category, req);
        return KbCategoryDto.from(categoryRepository.saveAndFlush(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        KbCategory category = findCategory(id);
        if (articleRepository.existsByCategoryIdAndIsDeletedFalse(id)) {
            throw new BusinessRuleViolationException("Move or delete this category's articles first");
        }
        softDelete(category);
        categoryRepository.saveAndFlush(category);
    }

    // ---- helpers ----

    private boolean isReadable(KbArticle a, String role) {
        if (a.getStatus() != ArticleStatus.PUBLISHED) return false;
        String filter = roleFilter(role);
        String roles = a.getVisibleRoles();
        return filter == null || roles == null || roles.isBlank() || List.of(roles.split(",")).contains(filter);
    }

    /** SUPERADMIN reads everything; any other role is matched against visibleRoles. */
    private static String roleFilter(String role) {
        return SUPERADMIN.equals(role) ? null : (role == null ? "" : role);
    }

    private void apply(KbArticle article, KbArticleRequest req) {
        categoryRepository.findByIdAndIsDeletedFalse(req.getCategoryId())
                .orElseThrow(() -> new BadRequestException("Unknown category: " + req.getCategoryId()));
        ArticleStatus status = req.getStatus() == null ? ArticleStatus.DRAFT : req.getStatus();
        if (status == ArticleStatus.PUBLISHED && article.getStatus() != ArticleStatus.PUBLISHED) {
            article.setPublishedAt(LocalDateTime.now());
        }
        article.setCategoryId(req.getCategoryId());
        article.setTitle(req.getTitle().trim());
        article.setSlug(req.getSlug());
        article.setBody(req.getBody());
        article.setStatus(status);
        article.setVisibleRoles(normaliseRoles(req.getVisibleRoles()));
    }

    private static void apply(KbCategory category, KbCategoryRequest req) {
        category.setName(req.getName().trim());
        category.setSlug(req.getSlug());
        category.setDisplayOrder(req.getDisplayOrder() == null ? 0 : req.getDisplayOrder());
    }

    private static String normaliseRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) return null;
        List<String> clean = roles.stream().map(r -> r == null ? "" : r.trim().toUpperCase()).distinct().toList();
        for (String r : clean) {
            if (!ROLES.contains(r)) throw new BadRequestException("Unknown role: " + r);
        }
        return String.join(",", clean);
    }

    private void softDelete(AuditableEntity entity) {
        entity.setIsDeleted(true);
        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(tenantContext.getCurrentUserId());
    }

    private KbArticle findArticle(Long id) {
        return articleRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + id));
    }

    private KbCategory findCategory(Long id) {
        return categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }
}
