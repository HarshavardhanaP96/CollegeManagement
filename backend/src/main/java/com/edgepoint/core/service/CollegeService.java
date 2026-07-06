// src/main/java/com/collegeManagement/service/college/CollegeService.java
package com.edgepoint.core.service;

import com.edgepoint.core.dto.CollegeCreateRequest;
import com.edgepoint.core.dto.CollegeUpdateRequest;
import com.edgepoint.core.dto.CollegeResponseDTO;
import com.edgepoint.core.dto.CollegeStatisticsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CollegeService {
    CollegeResponseDTO createCollege(CollegeCreateRequest request);
    CollegeResponseDTO updateCollege(Integer collegeId, CollegeUpdateRequest request);
    CollegeResponseDTO getCollegeById(Integer collegeId);
    Page<CollegeResponseDTO> getAllColleges(Pageable pageable, String search);
    void deleteCollege(Integer collegeId);
    CollegeStatisticsDTO getCollegeStatistics(Integer collegeId);
}