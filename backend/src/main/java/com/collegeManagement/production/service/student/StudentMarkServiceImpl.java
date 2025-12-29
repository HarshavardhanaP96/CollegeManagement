package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.response.student.ExamMarkDTO;
import com.collegeManagement.production.dto.response.student.StudentMarkDTO;
import com.collegeManagement.production.dto.response.student.SubjectMarkDTO;
import com.collegeManagement.production.entity.Mark;
import com.collegeManagement.production.entity.StudentProfile;
import com.collegeManagement.production.entity.Subject;
import com.collegeManagement.production.repository.MarkRepository;
import com.collegeManagement.production.repository.StudentProfileRepository;
import com.collegeManagement.production.repository.SubjectRepository;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentMarkServiceImpl implements StudentMarkService {

    private final MarkRepository markRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SubjectRepository subjectRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional(readOnly = true)
    public StudentMarkDTO getMyMarks(Integer semester) {
        Integer studentUserId = tenantContext.getCurrentUserId();

        StudentProfile profile = studentProfileRepository
                .findByStudentUserIdAndIsDeletedFalse(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        Integer targetSemester = semester != null ? semester : profile.getCurrentSemester();

        List<Mark> allMarks = markRepository.findByStudentId(studentUserId);

        // Group marks by subject
        Map<Integer, List<Mark>> marksBySubject = allMarks.stream()
                .collect(Collectors.groupingBy(m -> m.getAssignment().getClassSubject().getSubjectId()));

        List<SubjectMarkDTO> subjectMarksList = new ArrayList<>();
        BigDecimal totalObtained = BigDecimal.ZERO;
        Integer totalMaxMarks = 0;

        for (Map.Entry<Integer, List<Mark>> entry : marksBySubject.entrySet()) {
            Subject subject = subjectRepository.findById(entry.getKey()).orElse(null);
            if (subject == null) continue;

            List<Mark> subjectMarkList = entry.getValue();

            List<ExamMarkDTO> examMarksList = subjectMarkList.stream()
                    .map(m -> ExamMarkDTO.builder()
                            .examTypeName(m.getExamType().getExamTypeName())
                            .marksObtained(m.getMarksObtained())
                            .maxMarks(m.getExamType().getMaxMarks())
                            .percentage(calculatePercentage(m.getMarksObtained(), m.getExamType().getMaxMarks()))
                            .build())
                    .collect(Collectors.toList());

            BigDecimal subjectTotal = subjectMarkList.stream()
                    .map(Mark::getMarksObtained)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Integer subjectMaxMarks = subjectMarkList.stream()
                    .mapToInt(m -> m.getExamType().getMaxMarks())
                    .sum();

            subjectMarksList.add(SubjectMarkDTO.builder()
                    .subjectId(subject.getSubjectId())
                    .subjectName(subject.getSubjectName())
                    .subjectCode(subject.getSubjectCode())
                    .examMarks(examMarksList)
                    .totalMarks(subjectTotal)
                    .totalMaxMarks(subjectMaxMarks)
                    .percentage(calculatePercentage(subjectTotal, subjectMaxMarks))
                    .build());

            totalObtained = totalObtained.add(subjectTotal);
            totalMaxMarks += subjectMaxMarks;
        }

        Double overallPercentage = calculatePercentage(totalObtained, totalMaxMarks);
        String grade = calculateGrade(overallPercentage);

        return StudentMarkDTO.builder()
                .studentUserId(studentUserId)
                .studentName(profile.getUser().getFullName())
                .rollNumber(profile.getRollNumber())
                .semester(targetSemester)
                .subjectMarks(subjectMarksList)
                .overallPercentage(overallPercentage)
                .grade(grade)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectMarkDTO getMarksBySubject(Integer subjectId) {
        Integer studentUserId = tenantContext.getCurrentUserId();

        List<Mark> marks = markRepository.findByStudentId(studentUserId).stream()
                .filter(m -> m.getAssignment().getClassSubject().getSubjectId().equals(subjectId))
                .collect(Collectors.toList());

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        List<ExamMarkDTO> examMarksList = marks.stream()
                .map(m -> ExamMarkDTO.builder()
                        .examTypeName(m.getExamType().getExamTypeName())
                        .marksObtained(m.getMarksObtained())
                        .maxMarks(m.getExamType().getMaxMarks())
                        .percentage(calculatePercentage(m.getMarksObtained(), m.getExamType().getMaxMarks()))
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalMarks = marks.stream()
                .map(Mark::getMarksObtained)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer totalMaxMarks = marks.stream()
                .mapToInt(m -> m.getExamType().getMaxMarks())
                .sum();

        return SubjectMarkDTO.builder()
                .subjectId(subject.getSubjectId())
                .subjectName(subject.getSubjectName())
                .subjectCode(subject.getSubjectCode())
                .examMarks(examMarksList)
                .totalMarks(totalMarks)
                .totalMaxMarks(totalMaxMarks)
                .percentage(calculatePercentage(totalMarks, totalMaxMarks))
                .build();
    }



    private Double calculatePercentage(BigDecimal obtained, Integer max) {
        if (max == 0) return 0.0;
        return obtained.divide(BigDecimal.valueOf(max), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();
    }

    private String calculateGrade(Double percentage) {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 40) return "D";
        return "F";
    }
}