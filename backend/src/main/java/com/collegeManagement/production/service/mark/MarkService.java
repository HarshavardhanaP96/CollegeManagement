// src/main/java/com/collegeManagement/service/marks/MarksService.java
package com.collegeManagement.production.service.mark;

import com.collegeManagement.production.dto.request.mark.MarkCreateRequest;
import com.collegeManagement.production.dto.request.mark.MarkUpdateRequest;
import com.collegeManagement.production.dto.response.mark.MarkResponseDTO;
import com.collegeManagement.production.dto.response.mark.MarkSummaryDTO;
import com.collegeManagement.production.dto.response.mark.ExamTypeDTO;

import java.util.List;

public interface MarkService {
    MarkSummaryDTO enterMarks(MarkCreateRequest request);
    MarkResponseDTO updateMarks(Integer markId, MarkUpdateRequest request);
    List<MarkResponseDTO> getMarksByAssignment(Integer assignmentId, Integer examTypeId);
    MarkSummaryDTO getMarksSummary(Integer assignmentId, Integer examTypeId);
    List<ExamTypeDTO> getExamTypes();
}
