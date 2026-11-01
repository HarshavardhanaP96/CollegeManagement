package com.edgepoint.knowledgebase.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.knowledgebase.domain.ArticleStatus;
import com.edgepoint.knowledgebase.dto.KbArticleDto;
import com.edgepoint.knowledgebase.dto.KbArticleRequest;
import com.edgepoint.knowledgebase.dto.KbCategoryDto;
import com.edgepoint.knowledgebase.dto.KbCategoryRequest;
import com.edgepoint.knowledgebase.service.KnowledgeBaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Authoring side of the knowledge base. SUPERADMIN only. */
@RestController
@RequestMapping("/knowledgebase/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
@Tag(name = "Knowledge Base Admin", description = "Author and publish help articles")
public class KnowledgeBaseAdminController {

    private final KnowledgeBaseService service;

    @GetMapping("/articles")
    @Operation(summary = "List all articles", description = "Any status, newest first. Bodies are omitted.")
    public ResponseEntity<ApiResponse<Page<KbArticleDto>>> articles(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ArticleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.searchAll(q, status, KnowledgeBaseController.page(page, size)), "Articles retrieved"));
    }

    @GetMapping("/articles/{id}")
    @Operation(summary = "Get any article")
    public ResponseEntity<ApiResponse<KbArticleDto>> article(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getArticle(id), "Article retrieved"));
    }

    @PostMapping("/articles")
    @Operation(summary = "Create an article")
    public ResponseEntity<ApiResponse<KbArticleDto>> createArticle(@RequestBody @Valid KbArticleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createArticle(request), "Article created"));
    }

    @PutMapping("/articles/{id}")
    @Operation(summary = "Update an article", description = "Also moves it between DRAFT, PUBLISHED and ARCHIVED.")
    public ResponseEntity<ApiResponse<KbArticleDto>> updateArticle(@PathVariable Long id,
                                                                   @RequestBody @Valid KbArticleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.updateArticle(id, request), "Article updated"));
    }

    @DeleteMapping("/articles/{id}")
    @Operation(summary = "Delete an article")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable Long id) {
        service.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Article deleted"));
    }

    @PostMapping("/categories")
    @Operation(summary = "Create a category")
    public ResponseEntity<ApiResponse<KbCategoryDto>> createCategory(@RequestBody @Valid KbCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createCategory(request), "Category created"));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update a category")
    public ResponseEntity<ApiResponse<KbCategoryDto>> updateCategory(@PathVariable Long id,
                                                                     @RequestBody @Valid KbCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.updateCategory(id, request), "Category updated"));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete a category", description = "Refused while it still has articles.")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        service.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted"));
    }
}
