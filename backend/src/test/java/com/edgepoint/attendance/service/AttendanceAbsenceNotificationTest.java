package com.edgepoint.attendance.service;

import com.edgepoint.academic.domain.ClassSubject;
import com.edgepoint.academic.domain.StudentEnrollment;
import com.edgepoint.academic.domain.TeacherAssignment;
import com.edgepoint.academic.repository.StudentEnrollmentRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;
import com.edgepoint.attendance.dto.AttendanceCreateRequest;
import com.edgepoint.attendance.dto.StudentAttendanceDTO;
import com.edgepoint.attendance.repository.AttendanceRecordRepository;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.notification.dispatch.NotificationMessage;
import com.edgepoint.notification.domain.NotificationEventType;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AttendanceAbsenceNotificationTest {

    private static final LocalDate DATE = LocalDate.of(2026, 10, 19);

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
        when(tenantContext.getCollegeId()).thenReturn(7);
        when(teacherAssignmentRepository.findByAssignmentIdAndIsDeletedFalse(11)).thenReturn(Optional.of(a));
        when(enrollmentRepository.findActiveByClassId(3)).thenReturn(List.of(enrolled(101), enrolled(102)));
    }

    @Test
    void publishesOneMessagePerAbsentStudentWithParentContact() {
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(List.of(101)))
                .thenReturn(List.of(student("Asha Rao", "parent@x.com", "+911111111111")));

        service.markAttendance(request(att(101, false), att(102, true)));

        ArgumentCaptor<Object> cap = ArgumentCaptor.forClass(Object.class);
        verify(publisher, times(1)).publishEvent(cap.capture());
        NotificationMessage m = (NotificationMessage) cap.getValue();
        assertThat(m.collegeId()).isEqualTo(7);
        assertThat(m.eventType()).isEqualTo(NotificationEventType.ATTENDANCE_ABSENCE);
        assertThat(m.recipientEmail()).isEqualTo("parent@x.com");
        assertThat(m.recipientPhone()).isEqualTo("+911111111111");
        assertThat(m.body()).contains("Asha Rao").contains("2026-10-19");
        verify(studentProfileRepository).findByStudentUserIdInAndIsDeletedFalse(List.of(101));
    }

    @Test
    void allPresent_publishesNothing() {
        service.markAttendance(request(att(102, true)));

        verify(publisher, never()).publishEvent(any(Object.class));
    }

    @Test
    void absentStudentWithoutProfile_isSkippedWithoutFailingTheRequest() {
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(List.of(101))).thenReturn(List.of());

        service.markAttendance(request(att(101, false)));

        verify(publisher, never()).publishEvent(any(Object.class));
        verify(attendanceRepository).saveAll(any());
    }

    @Test
    void publisherFailure_doesNotFailAttendanceMarking() {
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(List.of(101)))
                .thenReturn(List.of(student("Asha Rao", "parent@x.com", "+911111111111")));
        doThrow(new RuntimeException("boom")).when(publisher).publishEvent(any(Object.class));

        service.markAttendance(request(att(101, false)));

        verify(attendanceRepository).saveAll(any());
    }

    @Test
    void erasedStudentsAreSkipped() {
        StudentProfile erased = student("Erased User", "", "");
        erased.getUser().setAnonymisedAt(java.time.LocalDateTime.now());
        when(studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(List.of(101))).thenReturn(List.of(erased));

        service.markAttendance(request(att(101, false)));

        verify(publisher, never()).publishEvent(any(Object.class));
        verify(attendanceRepository).saveAll(any());
    }

    private static StudentEnrollment enrolled(int id) {
        StudentEnrollment e = new StudentEnrollment();
        e.setStudentUserId(id);
        return e;
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

    private static StudentProfile student(String name, String parentEmail, String parentPhone) {
        User u = new User();
        u.setFullName(name);
        StudentProfile p = new StudentProfile();
        p.setUser(u);
        p.setParentEmail(parentEmail);
        p.setParentPhone(parentPhone);
        return p;
    }
}
