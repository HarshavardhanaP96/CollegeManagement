// src/main/java/com/collegeManagement/service/marks/MarksService.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.MarkCreateRequest;
import com.edgepoint.academic.dto.MarkUpdateRequest;
import com.edgepoint.academic.dto.MarkResponseDTO;
import com.edgepoint.academic.dto.MarkSummaryDTO;
import com.edgepoint.academic.dto.ExamTypeDTO;

import java.util.List;

public interface MarkService {
    MarkSummaryDTO enterMarks(MarkCreateRequest request);
    MarkResponseDTO updateMarks(Integer markId, MarkUpdateRequest request);
    List<MarkResponseDTO> getMarksByAssignment(Integer assignmentId, Integer examTypeId);
    MarkSummaryDTO getMarksSummary(Integer assignmentId, Integer examTypeId);
    List<ExamTypeDTO> getExamTypes();
}
