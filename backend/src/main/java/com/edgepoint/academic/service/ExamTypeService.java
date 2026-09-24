package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.ExamTypeCreateRequest;
import com.edgepoint.academic.dto.ExamTypeDTO;

import java.util.List;

public interface ExamTypeService {
    ExamTypeDTO createExamType(ExamTypeCreateRequest request);
    List<ExamTypeDTO> getExamTypes();
}
