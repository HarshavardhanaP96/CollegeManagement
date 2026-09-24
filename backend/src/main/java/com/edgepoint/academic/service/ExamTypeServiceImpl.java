package com.edgepoint.academic.service;

import com.edgepoint.academic.domain.ExamType;
import com.edgepoint.academic.dto.ExamTypeCreateRequest;
import com.edgepoint.academic.dto.ExamTypeDTO;
import com.edgepoint.academic.repository.ExamTypeRepository;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamTypeServiceImpl implements ExamTypeService {

    private final ExamTypeRepository examTypeRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public ExamTypeDTO createExamType(ExamTypeCreateRequest request) {
        Integer collegeId = tenantContext.getCollegeId();

        boolean exists = examTypeRepository.findByCollegeId(collegeId).stream()
                .anyMatch(et -> et.getExamTypeName().equalsIgnoreCase(request.getExamTypeName()));
        if (exists) {
            throw new DuplicateResourceException("Exam type already exists: " + request.getExamTypeName());
        }

        ExamType examType = new ExamType();
        examType.setCollegeId(collegeId);
        examType.setExamTypeName(request.getExamTypeName());
        examType.setMaxMarks(request.getMaxMarks());

        ExamType saved = examTypeRepository.save(examType);
        log.info("Exam type created: {} (ID: {})", saved.getExamTypeName(), saved.getExamTypeId());

        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamTypeDTO> getExamTypes() {
        Integer collegeId = tenantContext.getCollegeId();

        return examTypeRepository.findByCollegeId(collegeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private ExamTypeDTO mapToDTO(ExamType examType) {
        ExamTypeDTO dto = new ExamTypeDTO();
        dto.setExamTypeId(examType.getExamTypeId());
        dto.setExamTypeName(examType.getExamTypeName());
        dto.setMaxMarks(examType.getMaxMarks());
        return dto;
    }
}
