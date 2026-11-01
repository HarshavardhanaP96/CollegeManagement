package com.edgepoint.knowledgebase.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.knowledgebase.dto.KbArticleDto;
import com.edgepoint.knowledgebase.dto.KbCategoryDto;
import com.edgepoint.knowledgebase.dto.KbFeedbackRequest;
import com.edgepoint.knowledgebase.service.KnowledgeBaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Reader side of the knowledge base: any authenticated user, filtered by their role. */
@RestController
@RequestMapping("/knowledgebase")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Knowledge Base", description = "Help articles for every role")
public class KnowledgeBaseController {

    static final int MAX_PAGE_SIZE = 100;

    private final KnowledgeBaseService service;

    @GetMapping("/categories")
    @Operation(summary = "List categories")
    public ResponseEntity<ApiResponse<List<KbCategoryDto>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(service.listCategories(), "Categories retrieved"));
    }

    @GetMapping("/articles")
    @Operation(summary = "Search published articles", description = "Only articles visible to the caller's role. Bodies are omitted.")
    public ResponseEntity<ApiResponse<Page<KbArticleDto>>> articles(
            Authentication auth,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.searchPublished(role(auth), category, q, page(page, size)), "Articles retrieved"));
    }

    @GetMapping("/articles/{slug}")
    @Operation(summary = "Get a published article", description = "404 for drafts and articles outside the caller's role.")
    public ResponseEntity<ApiResponse<KbArticleDto>> article(Authentication auth, @PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(service.getPublished(role(auth), slug), "Article retrieved"));
    }

    @PostMapping("/articles/{id}/feedback")
    @Operation(summary = "Vote helpful / not helpful", description = "Re-voting replaces the caller's previous vote.")
    public ResponseEntity<ApiResponse<KbArticleDto>> feedback(Authentication auth, @PathVariable Long id,
                                                              @RequestBody @Valid KbFeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.vote(role(auth), id, request.getHelpful()), "Feedback recorded"));
    }

    static PageRequest page(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
    }

    /** Role name from the ROLE_ authority JwtAuthenticationFilter sets. */
    private static String role(Authentication auth) {
        if (auth == null) return null;
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_")).map(a -> a.substring(5)).findFirst().orElse(null);
    }
}
