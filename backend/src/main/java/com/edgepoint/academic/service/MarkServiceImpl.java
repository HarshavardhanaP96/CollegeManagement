package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.MarkCreateRequest;
import com.edgepoint.academic.dto.MarkUpdateRequest;
import com.edgepoint.academic.dto.StudentMarkDTO;
import com.edgepoint.academic.dto.MarkResponseDTO;
import com.edgepoint.academic.dto.MarkSummaryDTO;
import com.edgepoint.academic.dto.ExamTypeDTO;
import com.edgepoint.academic.domain.ExamType;
import com.edgepoint.academic.domain.Mark;
import com.edgepoint.academic.domain.TeacherAssignment;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.academic.repository.ExamTypeRepository;
import com.edgepoint.academic.repository.MarkRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarkServiceImpl implements MarkService {

    private final MarkRepository markRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final ExamTypeRepository examTypeRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public MarkSummaryDTO enterMarks(MarkCreateRequest request) {
        Integer teacherId = tenantContext.getCurrentUserId();

        // Validate teacher assignment
        TeacherAssignment assignment = teacherAssignmentRepository
                .findByAssignmentIdAndIsDeletedFalse(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        if (!assignment.getTeacherUserId().equals(teacherId)) {
            throw new BadRequestException("You are not assigned to this class-subject");
        }

        // Validate exam type
        ExamType examType = examTypeRepository.findById(request.getExamTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam type not found"));

        int enteredCount = 0;
        List<Mark> marksList = new ArrayList<>();
        BigDecimal totalMarks = BigDecimal.ZERO;
        BigDecimal maxPossibleMarks = BigDecimal.ZERO;

        for (StudentMarkDTO studentMark : request.getStudentMarks()) {
            // Check for duplicates
            if (markRepository.existsByAssignmentIdAndStudentUserIdAndExamTypeIdAndIsDeletedFalse(
                    request.getAssignmentId(), studentMark.getStudentUserId(), request.getExamTypeId())) {
                throw new DuplicateResourceException(
                        "Mark already entered for student: " + studentMark.getStudentUserId());
            }

            // Validate marks
            if (studentMark.getMarksObtained().compareTo(BigDecimal.valueOf(examType.getMaxMarks())) > 0) {
                throw new BadRequestException(
                        "Mark cannot exceed maximum: " + examType.getMaxMarks());
            }

            Mark mark = new Mark();
            mark.setAssignmentId(request.getAssignmentId());
            mark.setStudentUserId(studentMark.getStudentUserId());
            mark.setExamTypeId(request.getExamTypeId());
            mark.setMarksObtained(studentMark.getMarksObtained());
            mark.setRemarks(studentMark.getRemarks());
            mark.setCreatedBy(teacherId);

            marksList.add(mark);

            totalMarks = totalMarks.add(studentMark.getMarksObtained());
            maxPossibleMarks = maxPossibleMarks.add(BigDecimal.valueOf(examType.getMaxMarks()));
            enteredCount++;
        }

        markRepository.saveAll(marksList);
        log.info("Marks entered for {} students", enteredCount);

        double averageMarks = enteredCount > 0 ?
                totalMarks.divide(BigDecimal.valueOf(enteredCount), 2, RoundingMode.HALF_UP).doubleValue() : 0.0;

        double averagePercentage = maxPossibleMarks.compareTo(BigDecimal.ZERO) > 0 ?
                totalMarks.divide(maxPossibleMarks, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue() : 0.0;

        return MarkSummaryDTO.builder()
                .assignmentId(request.getAssignmentId())
                .examTypeId(request.getExamTypeId())
                .examTypeName(examType.getExamTypeName())
                .totalStudents(enteredCount)
                .enteredCount(enteredCount)
                .averageMarks(averageMarks)
                .averagePercentage(averagePercentage)
                .maxMarks(examType.getMaxMarks())
                .build();
    }

    @Override
    @Transactional
    public MarkResponseDTO updateMarks(Integer markId, MarkUpdateRequest request) {
        Mark mark = markRepository.findByMarkIdAndIsDeletedFalse(markId)
                .orElseThrow(() -> new ResourceNotFoundException("Mark record not found"));

        validateTeacherAccess(mark.getAssignmentId());

        ExamType examType = examTypeRepository.findById(mark.getExamTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam type not found"));

        if (request.getMarksObtained().compareTo(BigDecimal.valueOf(examType.getMaxMarks())) > 0) {
            throw new BadRequestException("Mark cannot exceed maximum: " + examType.getMaxMarks());
        }

        mark.setMarksObtained(request.getMarksObtained());
        if (request.getRemarks() != null) {
            mark.setRemarks(request.getRemarks());
        }
        mark.setUpdatedBy(tenantContext.getCurrentUserId());

        Mark updated = markRepository.save(mark);
        log.info("Mark updated: {}", markId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarkResponseDTO> getMarksByAssignment(Integer assignmentId, Integer examTypeId) {
        validateTeacherAccess(assignmentId);

        List<Mark> marksList;
        if (examTypeId != null) {
            marksList = markRepository.findByAssignmentIdAndExamTypeId(assignmentId, examTypeId);
        } else {
            marksList = markRepository.findByAssignmentId(assignmentId);
        }

        return marksList.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MarkSummaryDTO getMarksSummary(Integer assignmentId, Integer examTypeId) {
        validateTeacherAccess(assignmentId);

        List<Mark> marksList;
        if (examTypeId != null) {
            marksList = markRepository.findByAssignmentIdAndExamTypeId(assignmentId, examTypeId);
        } else {
            marksList = markRepository.findByAssignmentId(assignmentId);
        }

        if (marksList.isEmpty()) {
            return MarkSummaryDTO.builder()
                    .assignmentId(assignmentId)
                    .enteredCount(0)
                    .build();
        }

        BigDecimal total = marksList.stream()
                .map(Mark::getMarksObtained)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double average = total.divide(BigDecimal.valueOf(marksList.size()), 2, RoundingMode.HALF_UP)
                .doubleValue();

        return MarkSummaryDTO.builder()
                .assignmentId(assignmentId)
                .examTypeId(examTypeId)
                .totalStudents(marksList.size())
                .enteredCount(marksList.size())
                .averageMarks(average)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamTypeDTO> getExamTypes() {
        Integer collegeId = tenantContext.getCollegeId();

        return examTypeRepository.findByCollegeId(collegeId).stream()
                .map(this::mapToExamTypeDTO)
                .collect(Collectors.toList());
    }

    private void validateTeacherAccess(Integer assignmentId) {
        Integer teacherId = tenantContext.getCurrentUserId();
        TeacherAssignment assignment = teacherAssignmentRepository
                .findByAssignmentIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        if (!assignment.getTeacherUserId().equals(teacherId)) {
            throw new BadRequestException("Access denied to this assignment");
        }
    }

    private MarkResponseDTO mapToResponseDTO(Mark mark) {
        MarkResponseDTO dto = new MarkResponseDTO();
        dto.setMarkId(mark.getMarkId());
        dto.setAssignmentId(mark.getAssignmentId());
        dto.setStudentUserId(mark.getStudentUserId());
        dto.setStudentName(mark.getStudent().getFullName());
        dto.setExamTypeId(mark.getExamTypeId());
        dto.setExamTypeName(mark.getExamType().getExamTypeName());
        dto.setMarksObtained(mark.getMarksObtained());
        dto.setMaxMarks(mark.getExamType().getMaxMarks());
        dto.setRemarks(mark.getRemarks());
        dto.setCreatedAt(mark.getCreatedAt());
        return dto;
    }

    private ExamTypeDTO mapToExamTypeDTO(ExamType examType) {
        ExamTypeDTO dto = new ExamTypeDTO();
        dto.setExamTypeId(examType.getExamTypeId());
        dto.setExamTypeName(examType.getExamTypeName());
        dto.setMaxMarks(examType.getMaxMarks());
        return dto;
    }
}