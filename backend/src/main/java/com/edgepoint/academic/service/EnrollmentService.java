package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.EnrollmentCreateRequest;
import com.edgepoint.academic.dto.EnrollmentResponseDTO;

import java.util.List;

public interface EnrollmentService {
    EnrollmentResponseDTO enrollStudent(EnrollmentCreateRequest request);
    List<EnrollmentResponseDTO> getEnrollmentsByClass(Integer classId);
}
