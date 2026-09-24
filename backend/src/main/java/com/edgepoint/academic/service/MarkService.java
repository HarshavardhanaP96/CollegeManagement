// src/main/java/com/collegeManagement/service/marks/MarksService.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.MarkCreateRequest;
import com.edgepoint.academic.dto.MarkUpdateRequest;
import com.edgepoint.academic.dto.MarkResponseDTO;
import com.edgepoint.academic.dto.MarkSummaryDTO;
import com.edgepoint.academic.dto.RosterStudentDTO;

import java.util.List;

public interface MarkService {
    MarkSummaryDTO enterMarks(MarkCreateRequest request);
    MarkResponseDTO updateMarks(Integer markId, MarkUpdateRequest request);
    List<MarkResponseDTO> getMarksByAssignment(Integer assignmentId, Integer examTypeId);
    MarkSummaryDTO getMarksSummary(Integer assignmentId, Integer examTypeId);
    /** Students enrolled in this assignment's class — the roster to grade. */
    List<RosterStudentDTO> getRoster(Integer assignmentId);
}
