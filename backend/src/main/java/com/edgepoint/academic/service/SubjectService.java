// src/main/java/com/collegeManagement/service/subject/SubjectService.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.SubjectCreateRequest;
import com.edgepoint.academic.dto.SubjectUpdateRequest;
import com.edgepoint.academic.dto.SubjectResponseDTO;

import java.util.List;

public interface SubjectService {
    SubjectResponseDTO createSubject(SubjectCreateRequest request);
    SubjectResponseDTO updateSubject(Integer subjectId, SubjectUpdateRequest request);
    SubjectResponseDTO getSubjectById(Integer subjectId);
    List<SubjectResponseDTO> getAllSubjects();
    void deleteSubject(Integer subjectId);
}

// Implementation similar to above services...
