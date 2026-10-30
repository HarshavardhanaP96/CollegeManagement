package com.edgepoint.attendance.service;

import com.edgepoint.academic.domain.ClassSubject;
import com.edgepoint.academic.domain.StudentEnrollment;
import com.edgepoint.academic.domain.TeacherAssignment;
import com.edgepoint.academic.dto.RosterStudentDTO;
import com.edgepoint.academic.repository.StudentEnrollmentRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;
import com.edgepoint.attendance.domain.AttendanceRecord;
import com.edgepoint.attendance.dto.AttendanceCreateRequest;
import com.edgepoint.attendance.dto.AttendanceSummaryDTO;
import com.edgepoint.attendance.dto.StudentAttendanceDTO;
import com.edgepoint.attendance.repository.AttendanceRecordRepository;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.notification.dispatch.NotificationMessage;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AttendanceBulkMarkTest {

    private static final LocalDate DATE = LocalDate.of(2026, 10, 30);

    @Mock AttendanceRecordRepository attendanceRepository;
    @Mock TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock StudentEnrollmentRepository enrollmentRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock TenantContext tenantContext;
    @Mock ApplicationEventPublisher publisher;

    AttendanceServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AttendanceServiceImpl(attendanceRepository, teacherAssignmentRepository,
                enrollmentRepository, studentProfileRepository, tenantContext, publisher);

        ClassSubject cs = new ClassSubject();
        cs.setClassId(3);
        TeacherAssignment a = new TeacherAssignment();
        a.setAssignmentId(11);
        a.setTeacherUserId(5);
        a.setClassSubject(cs);
        when(tenantContext.getCurrentUserId()).thenReturn(5);
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(11)).thenReturn(Optional.of(a));
        when(enrollmentRepository.findActiveByClassId(3))
                .thenReturn(List.of(enrolled(101, "Asha"), enrolled(102, "Ravi"), enrolled(103, "Meera")));
        when(attendanceRepository.findByAssignmentIdAndRecordDateAndIsDeletedFalse(11, DATE)).thenReturn(List.of());
    }

    @Test
    void wholeClassInOneRequest_insertsOneRecordPerStudentAndSummarises() {
        AttendanceSummaryDTO summary = service.markAttendance(request(att(101, true), att(102, false), att(103, true)));

        assertThat(saved()).hasSize(3);
        assertThat(summary.getTotalStudents()).isEqualTo(3);
        assertThat(summary.getPresentCount()).isEqualTo(2);
        assertThat(summary.getAbsentCount()).isEqualTo(1);
        assertThat(summary.getUnmarkedCount()).isZero();
    }

    @Test
    void studentNotEnrolledInClass_isRejectedAndNothingSaved() {
        assertThatThrownBy(() -> service.markAttendance(request(att(101, true), att(999, true))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("999");

        verify(attendanceRepository, never()).saveAll(any());
    }

    @Test
    void sameStudentTwiceInRequest_isRejected() {
        assertThatThrownBy(() -> service.markAttendance(request(att(101, true), att(101, false))))
                .isInstanceOf(BadRequestException.class);

        verify(attendanceRepository, never()).saveAll(any());
    }

    @Test
    void resubmittingTheSameDay_updatesExistingRecordsInsteadOfFailing() {
        AttendanceRecord existing = record(101, true);
        when(attendanceRepository.findByAssignmentIdAndRecordDateAndIsDeletedFalse(11, DATE))
                .thenReturn(List.of(existing));

        service.markAttendance(request(att(101, false), att(102, true)));

        List<AttendanceRecord> saved = saved();
        assertThat(saved).hasSize(2);
        assertThat(saved).contains(existing);
        assertThat(existing.getIsPresent()).isFalse();
        assertThat(existing.getUpdatedBy()).isEqualTo(5);
        assertThat(saved).filteredOn(r -> r.getStudentUserId() == 102)
                .singleElement().satisfies(r -> assertThat(r.getAttendanceId()).isNull());
    }

    @Test
    void resubmitting_notifiesOnlyStudentsNewlyMarkedAbsent() {
        when(attendanceRepository.findByAssignmentIdAndRecordDateAndIsDeletedFalse(11, DATE))
                .thenReturn(List.of(record(101, false), record(102, true)));
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(anyCollection()))
                .thenReturn(List.of(profile(102, "Ravi")));

        service.markAttendance(request(att(101, false), att(102, false)));

        verify(studentProfileRepository).findByStudentUserIdInAndIsDeletedFalse(List.of(102));
        ArgumentCaptor<Object> cap = ArgumentCaptor.forClass(Object.class);
        verify(publisher, times(1)).publishEvent(cap.capture());
        assertThat(((NotificationMessage) cap.getValue()).body()).contains("Ravi");
    }

    @Test
    void absenceNotifications_lookUpAllProfilesInOneQuery() {
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(anyCollection()))
                .thenReturn(List.of(profile(101, "Asha"), profile(102, "Ravi")));

        service.markAttendance(request(att(101, false), att(102, false), att(103, true)));

        verify(studentProfileRepository, times(1)).findByStudentUserIdInAndIsDeletedFalse(anyCollection());
        verify(studentProfileRepository, never()).findByStudentUserIdAndIsDeletedFalse(anyInt());
        verify(publisher, times(2)).publishEvent(any(Object.class));
    }

    @Test
    void roster_loadsRollNumbersInOneQuery() {
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(anyCollection()))
                .thenReturn(List.of(profile(101, "Asha"), profile(103, "Meera")));

        List<RosterStudentDTO> roster = service.getRoster(11);

        assertThat(roster).extracting(RosterStudentDTO::getRollNumber).containsExactly("R101", null, "R103");
        verify(studentProfileRepository, never()).findByStudentUserIdAndIsDeletedFalse(anyInt());
    }

    @SuppressWarnings("unchecked")
    private List<AttendanceRecord> saved() {
        ArgumentCaptor<Iterable<AttendanceRecord>> cap = ArgumentCaptor.forClass(Iterable.class);
        verify(attendanceRepository).saveAll(cap.capture());
        List<AttendanceRecord> out = new ArrayList<>();
        cap.getValue().forEach(out::add);
        return out;
    }

    private static StudentEnrollment enrolled(int id, String name) {
        User u = new User();
        u.setUserId(id);
        u.setFullName(name);
        StudentEnrollment e = new StudentEnrollment();
        e.setStudentUserId(id);
        e.setStudent(u);
        return e;
    }

    private static AttendanceRecord record(int studentId, boolean present) {
        AttendanceRecord r = new AttendanceRecord();
        r.setAttendanceId(studentId * 10);
        r.setAssignmentId(11);
        r.setStudentUserId(studentId);
        r.setRecordDate(DATE);
        r.setIsPresent(present);
        return r;
    }

    private static StudentProfile profile(int id, String name) {
        User u = new User();
        u.setFullName(name);
        StudentProfile p = new StudentProfile();
        p.setStudentUserId(id);
        p.setRollNumber("R" + id);
        p.setUser(u);
        p.setParentEmail(name.toLowerCase() + "@parent.test");
        return p;
    }

    private static StudentAttendanceDTO att(int id, boolean present) {
        StudentAttendanceDTO d = new StudentAttendanceDTO();
        d.setStudentUserId(id);
        d.setIsPresent(present);
        return d;
    }

    private static AttendanceCreateRequest request(StudentAttendanceDTO... atts) {
        AttendanceCreateRequest r = new AttendanceCreateRequest();
        r.setAssignmentId(11);
        r.setRecordDate(DATE);
        r.setStudentAttendances(List.of(atts));
        return r;
    }
}
