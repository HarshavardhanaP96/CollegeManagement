package com.collegeManagement.production.service.subject;

import com.collegeManagement.production.dto.request.subject.SubjectCreateRequest;
import com.collegeManagement.production.dto.request.subject.SubjectUpdateRequest;
import com.collegeManagement.production.dto.response.subject.SubjectResponseDTO;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class SubjectServiceImpl implements SubjectService {

    @Override
    public SubjectResponseDTO createSubject(SubjectCreateRequest request) {
        return new SubjectResponseDTO();
    }

    @Override
    public SubjectResponseDTO updateSubject(Integer subjectId, SubjectUpdateRequest request) {
        return new SubjectResponseDTO();
    }

    @Override
    public SubjectResponseDTO getSubjectById(Integer subjectId) {
        return new SubjectResponseDTO();
    }

    @Override
    public List<SubjectResponseDTO> getAllSubjects() {
        return Collections.emptyList();
    }

    @Override
    public void deleteSubject(Integer subjectId) {
    }
}
