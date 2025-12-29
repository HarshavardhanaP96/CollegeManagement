// src/main/java/com/collegeManagement/service/subject/SubjectService.java
package com.collegeManagement.production.service.subject;

import com.collegeManagement.production.dto.request.subject.SubjectCreateRequest;
import com.collegeManagement.production.dto.request.subject.SubjectUpdateRequest;
import com.collegeManagement.production.dto.response.subject.SubjectResponseDTO;

import java.util.List;

public interface SubjectService {
    SubjectResponseDTO createSubject(SubjectCreateRequest request);
    SubjectResponseDTO updateSubject(Integer subjectId, SubjectUpdateRequest request);
    SubjectResponseDTO getSubjectById(Integer subjectId);
    List<SubjectResponseDTO> getAllSubjects();
    void deleteSubject(Integer subjectId);
}

// Implementation similar to above services...
