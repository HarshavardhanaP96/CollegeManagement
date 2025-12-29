// src/main/java/com/collegeManagement/service/college/CollegeService.java
package com.collegeManagement.production.service.college;

import com.collegeManagement.production.dto.request.college.CollegeCreateRequest;
import com.collegeManagement.production.dto.request.college.CollegeUpdateRequest;
import com.collegeManagement.production.dto.response.college.CollegeResponseDTO;
import com.collegeManagement.production.dto.response.college.CollegeStatisticsDTO;
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