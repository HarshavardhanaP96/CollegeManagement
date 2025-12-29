package com.collegeManagement.production.unit.service.mark;

import com.collegeManagement.production.config.TestDataBuilder;
import com.collegeManagement.production.dto.request.mark.MarkCreateRequest;
import com.collegeManagement.production.dto.request.mark.MarkUpdateRequest;
import com.collegeManagement.production.dto.request.mark.StudentMarkDTO;
import com.collegeManagement.production.dto.response.mark.MarkResponseDTO;
import com.collegeManagement.production.dto.response.mark.MarkSummaryDTO;
import com.collegeManagement.production.entity.ExamType;
import com.collegeManagement.production.entity.Mark;
import com.collegeManagement.production.entity.TeacherAssignment;
import com.collegeManagement.production.entity.User;
import com.collegeManagement.production.exception.BadRequestException;
import com.collegeManagement.production.exception.DuplicateResourceException;

import com.collegeManagement.production.repository.ExamTypeRepository;
import com.collegeManagement.production.repository.MarkRepository;
import com.collegeManagement.production.repository.TeacherAssignmentRepository;
import com.collegeManagement.production.security.TenantContext;
import com.collegeManagement.production.service.mark.MarkServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MarkService Unit Tests")
class MarkServiceTest {

    @Mock
    private MarkRepository markRepository;

    @Mock
    private TeacherAssignmentRepository teacherAssignmentRepository;

    @Mock
    private ExamTypeRepository examTypeRepository;

    @Mock
    private TenantContext tenantContext;

    @InjectMocks
    private MarkServiceImpl markService;

    private TeacherAssignment testAssignment;
    private User testStudent;
    private ExamType testExamType;
    private Mark testMark;
    private MarkCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        testStudent = TestDataBuilder.UserBuilder.aUser()
                .withId(100)
                .asStudent()
                .build();

        testAssignment = new TeacherAssignment();
        testAssignment.setAssignmentId(1);
        testAssignment.setTeacherUserId(20);
        testAssignment.setIsActive(true);

        testExamType = new ExamType();
        testExamType.setExamTypeId(1);
        testExamType.setExamTypeName("Internal 1");
        testExamType.setMaxMarks(50);

        testMark = new Mark();
        testMark.setMarkId(1);
        testMark.setAssignmentId(1);
        testMark.setStudentUserId(100);
        testMark.setExamTypeId(1);
        testMark.setMarksObtained(BigDecimal.valueOf(45.5));
        testMark.setStudent(testStudent);
        testMark.setExamType(testExamType);

        // Setup create request
        StudentMarkDTO studentMarkDTO = new StudentMarkDTO();
        studentMarkDTO.setStudentUserId(100);
        studentMarkDTO.setMarksObtained(BigDecimal.valueOf(45.5));

        createRequest = new MarkCreateRequest();
        createRequest.setAssignmentId(1);
        createRequest.setExamTypeId(1);
        createRequest.setStudentMarks(Arrays.asList(studentMarkDTO));
    }

    @Test
    @DisplayName("enterMarks_withValidData_shouldCreateMarkRecords")
    void enterMarks_withValidData_shouldCreateMarkRecords() {
        // Arrange
        when(tenantContext.getCurrentUserId()).thenReturn(20);
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(anyInt()))
                .thenReturn(Optional.of(testAssignment));
        when(examTypeRepository.findById(anyInt())).thenReturn(Optional.of(testExamType));
        when(markRepository.existsByAssignmentIdAndStudentUserIdAndExamTypeIdAndIsDeletedFalse(
                anyInt(), anyInt(), anyInt())).thenReturn(false);

        // Act
        MarkSummaryDTO result = markService.enterMarks(createRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEnteredCount()).isEqualTo(1);
        verify(markRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("enterMarks_exceedingMaxMarks_shouldThrowBadRequestException")
    void enterMarks_exceedingMaxMarks_shouldThrowBadRequestException() {
        // Arrange
        createRequest.getStudentMarks().get(0).setMarksObtained(BigDecimal.valueOf(60)); // Exceeds 50
        when(tenantContext.getCurrentUserId()).thenReturn(20);
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(anyInt()))
                .thenReturn(Optional.of(testAssignment));
        when(examTypeRepository.findById(anyInt())).thenReturn(Optional.of(testExamType));
        when(markRepository.existsByAssignmentIdAndStudentUserIdAndExamTypeIdAndIsDeletedFalse(
                anyInt(), anyInt(), anyInt())).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> markService.enterMarks(createRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mark cannot exceed maximum");

        verify(markRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("enterMarks_byUnauthorizedTeacher_shouldThrowBadRequestException")
    void enterMarks_byUnauthorizedTeacher_shouldThrowBadRequestException() {
        // Arrange
        when(tenantContext.getCurrentUserId()).thenReturn(99); // Different teacher
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(anyInt()))
                .thenReturn(Optional.of(testAssignment));

        // Act & Assert
        assertThatThrownBy(() -> markService.enterMarks(createRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("You are not assigned");

        verify(markRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("enterMarks_withDuplicateEntry_shouldThrowDuplicateResourceException")
    void enterMarks_withDuplicateEntry_shouldThrowDuplicateResourceException() {
        // Arrange
        when(tenantContext.getCurrentUserId()).thenReturn(20);
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(anyInt()))
                .thenReturn(Optional.of(testAssignment));
        when(examTypeRepository.findById(anyInt())).thenReturn(Optional.of(testExamType));
        when(markRepository.existsByAssignmentIdAndStudentUserIdAndExamTypeIdAndIsDeletedFalse(
                anyInt(), anyInt(), anyInt())).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> markService.enterMarks(createRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already entered");

        verify(markRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("getMarksByAssignment_shouldReturnMarkRecords")
    void getMarksByAssignment_shouldReturnMarkRecords() {
        // Arrange
        when(tenantContext.getCurrentUserId()).thenReturn(20);
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(anyInt()))
                .thenReturn(Optional.of(testAssignment));
        when(markRepository.findByAssignmentId(anyInt())).thenReturn(Arrays.asList(testMark));

        // Act
        List<MarkResponseDTO> result = markService.getMarksByAssignment(1, null);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.size()).isEqualTo(1);
        verify(markRepository, times(1)).findByAssignmentId(1);
    }

    @Test
    @DisplayName("updateMarks_withValidData_shouldUpdateRecord")
    void updateMarks_withValidData_shouldUpdateRecord() {
        // Arrange
        MarkUpdateRequest updateRequest = new MarkUpdateRequest();
        updateRequest.setMarksObtained(BigDecimal.valueOf(48.0));
        updateRequest.setRemarks("Updated");

        when(tenantContext.getCurrentUserId()).thenReturn(20);
        when(markRepository.findByMarkIdAndIsDeletedFalse(anyInt())).thenReturn(Optional.of(testMark));
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(anyInt()))
                .thenReturn(Optional.of(testAssignment));
        when(examTypeRepository.findById(anyInt())).thenReturn(Optional.of(testExamType));
        when(markRepository.save(any(Mark.class))).thenReturn(testMark);

        // Act
        MarkResponseDTO result = markService.updateMarks(1, updateRequest);

        // Assert
        assertThat(result).isNotNull();
        verify(markRepository, times(1)).save(testMark);
    }
}