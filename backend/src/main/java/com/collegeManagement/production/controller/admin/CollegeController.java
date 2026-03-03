package com.collegeManagement.production.controller.admin;

import com.collegeManagement.production.dto.request.college.CollegeCreateRequest;
import com.collegeManagement.production.dto.request.college.CollegeUpdateRequest;
import com.collegeManagement.production.dto.response.ApiResponse;
import com.collegeManagement.production.dto.response.college.CollegeResponseDTO;
import com.collegeManagement.production.dto.response.college.CollegeStatisticsDTO;
import com.collegeManagement.production.service.college.CollegeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Controller for SuperAdmin college management operations
 * Only SuperAdmin can access these endpoints
 */
@Slf4j
@RestController
@RequestMapping("/colleges")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
@Tag(name = "SuperAdmin - Colleges", description = "College management APIs for SuperAdmin")
public class CollegeController {

    private final CollegeService collegeService;

    @PostMapping
    @Operation(summary = "Create new college", description = "Create a new college in the system")
    public ResponseEntity<ApiResponse<CollegeResponseDTO>> createCollege(
            @Valid @RequestBody CollegeCreateRequest request) {
        log.info("Creating new college: {}", request.getCollegeName());

        CollegeResponseDTO response = collegeService.createCollege(request);

        log.info("College created successfully with ID: {}", response.getCollegeId());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<CollegeResponseDTO>builder()
                        .success(true)
                        .message("College created successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @GetMapping
    @Operation(summary = "Get all colleges", description = "Retrieve paginated list of all colleges")
    public ResponseEntity<ApiResponse<Page<CollegeResponseDTO>>> getAllColleges(
            @PageableDefault(size = 20, sort = "collegeName", direction = Sort.Direction.ASC)
            Pageable pageable,
            @Parameter(description = "Search term for college name or code")
            @RequestParam(required = false) String search) {
        log.info("Fetching all colleges - page: {}, size: {}, search: {}",
                pageable.getPageNumber(), pageable.getPageSize(), search);

        Page<CollegeResponseDTO> colleges = collegeService.getAllColleges(pageable, search);

        return ResponseEntity.ok(
                ApiResponse.<Page<CollegeResponseDTO>>builder()
                        .success(true)
                        .message("Colleges retrieved successfully")
                        .data(colleges)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @GetMapping("/{collegeId}")
    @Operation(summary = "Get college by ID", description = "Retrieve college details by ID")
    public ResponseEntity<ApiResponse<CollegeResponseDTO>> getCollegeById(
            @Parameter(description = "College ID") @PathVariable Integer collegeId) {
        log.info("Fetching college with ID: {}", collegeId);

        CollegeResponseDTO response = collegeService.getCollegeById(collegeId);

        return ResponseEntity.ok(
                ApiResponse.<CollegeResponseDTO>builder()
                        .success(true)
                        .message("College retrieved successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PutMapping("/{collegeId}")
    @Operation(summary = "Update college", description = "Update college information")
    public ResponseEntity<ApiResponse<CollegeResponseDTO>> updateCollege(
            @Parameter(description = "College ID") @PathVariable Integer collegeId,
            @Valid @RequestBody CollegeUpdateRequest request) {
        log.info("Updating college with ID: {}", collegeId);

        CollegeResponseDTO response = collegeService.updateCollege(collegeId, request);

        log.info("College updated successfully: {}", collegeId);

        return ResponseEntity.ok(
                ApiResponse.<CollegeResponseDTO>builder()
                        .success(true)
                        .message("College updated successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @DeleteMapping("/{collegeId}")
    @Operation(summary = "Delete college", description = "Soft delete college (sets is_deleted flag)")
    public ResponseEntity<ApiResponse<Void>> deleteCollege(
            @Parameter(description = "College ID") @PathVariable Integer collegeId) {
        log.info("Deleting college with ID: {}", collegeId);

        collegeService.deleteCollege(collegeId);

        log.info("College deleted successfully: {}", collegeId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("College deleted successfully")
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @GetMapping("/{collegeId}/statistics")
    @Operation(summary = "Get college statistics", description = "Get statistics for a specific college")
    public ResponseEntity<ApiResponse<CollegeStatisticsDTO>> getCollegeStatistics(
            @Parameter(description = "College ID") @PathVariable Integer collegeId) {
        log.info("Fetching statistics for college: {}", collegeId);

        CollegeStatisticsDTO statistics = collegeService.getCollegeStatistics(collegeId);

        return ResponseEntity.ok(
                ApiResponse.<CollegeStatisticsDTO>builder()
                        .success(true)
                        .message("Statistics retrieved successfully")
                        .data(statistics)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}