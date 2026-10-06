import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Select, Breadcrumbs, Loading, DetailGrid, DetailField, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common';
import { getClassById, getClassSubjects, addSubjectToClass } from '../../api/class';
import { getCourseById } from '../../api/course';
import { getSubjects } from '../../api/subject';
import { getAssignmentsByClass, assignTeacher } from '../../api/assignment';
import { getTeachers } from '../../api/teacher';
import { getEnrollmentsByClass, enrollStudent } from '../../api/enrollment';
import { getStudents } from '../../api/student';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const classId = Number(id);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.classes.byId(classId),
    queryFn: () => getClassById(classId),
    enabled: Number.isFinite(classId),
  });

  const cls = data?.data;

  // ClassResponseDTO only carries courseId, not a course name.
  const { data: courseData } = useQuery({
    queryKey: queryKeys.courses.byId(cls?.courseId ?? -1),
    queryFn: () => getCourseById(cls!.courseId),
    enabled: !!cls?.courseId,
  });

  const { data: classSubjectsData } = useQuery({
    queryKey: queryKeys.classSubjects.byClass(classId),
    queryFn: () => getClassSubjects(classId),
    enabled: Number.isFinite(classId),
  });
  const classSubjects = classSubjectsData?.data || [];

  const { data: allSubjectsData } = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => getSubjects(),
  });
  const allSubjects = allSubjectsData?.data || [];
  const linkableSubjects = allSubjects.filter(
    (s) => !classSubjects.some((cs) => cs.subjectId === s.subjectId)
  );

  const { data: assignmentsData } = useQuery({
    queryKey: queryKeys.classAssignments.byClass(classId),
    queryFn: () => getAssignmentsByClass(classId),
    enabled: Number.isFinite(classId),
  });
  const assignments = assignmentsData?.data || [];

  const { data: teachersData } = useQuery({
    queryKey: queryKeys.teachers.all,
    queryFn: () => getTeachers(),
  });
  const teachers = teachersData?.data || [];

  const { data: enrollmentsData } = useQuery({
    queryKey: queryKeys.enrollments.byClass(classId),
    queryFn: () => getEnrollmentsByClass(classId),
    enabled: Number.isFinite(classId),
  });
  const enrollments = enrollmentsData?.data || [];

  const { data: studentsData } = useQuery({
    queryKey: queryKeys.students.all,
    queryFn: () => getStudents(),
  });
  const students = studentsData?.data || [];
  const enrollableStudents = students.filter(
    (s) => !enrollments.some((e) => e.studentUserId === s.userId)
  );

  const addSubjectMutation = useMutation({
    mutationFn: (subjectId: number) => addSubjectToClass(classId, { subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classSubjects.byClass(classId) });
      setSelectedSubjectId('');
    },
    onError: (error) => alert(getErrorMessage(error).message),
  });

  const assignTeacherMutation = useMutation({
    mutationFn: assignTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classAssignments.byClass(classId) });
      setSelectedClassSubjectId('');
      setSelectedTeacherId('');
    },
    onError: (error) => alert(getErrorMessage(error).message),
  });

  const enrollMutation = useMutation({
    mutationFn: enrollStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.byClass(classId) });
      setSelectedStudentId('');
    },
    onError: (error) => alert(getErrorMessage(error).message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Classes', path: '/classes' }, { label: 'Manage' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              {isLoading ? 'Loading…' : cls?.className || 'Class'}
            </h1>
            <p className="mt-1 text-slate-500 text-sm">Term, section and program for this class.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/classes')}>Back to classes</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading class…" /></Card>
      ) : isError || !cls ? (
        <Card><p className="text-center text-slate-500">Class not found.</p></Card>
      ) : (
        <>
          <Card>
            <DetailGrid>
              <DetailField label="Class / Alias" value={cls.className} />
              <DetailField label="Academic Year" value={cls.academicYear} />
              <DetailField label="Semester" value={cls.semester} />
              <DetailField label="Section" value={cls.section} />
              <DetailField label="Program" value={courseData?.data.courseName || `Course #${cls.courseId}`} />
              <DetailField label="Registered" value={new Date(cls.createdAt).toLocaleDateString()} />
            </DetailGrid>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Subjects</h2>
            {classSubjects.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubjects.map((cs) => (
                    <TableRow key={cs.classSubjectId}>
                      <TableCell className="font-medium">{cs.subjectName}</TableCell>
                      <TableCell>{cs.subjectCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Can action="update" resource="classes">
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Link a subject"
                    options={linkableSubjects.map((s) => ({ value: s.subjectId, label: `${s.subjectName} (${s.subjectCode})` }))}
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    placeholder="Select a subject"
                  />
                </div>
                <Button
                  disabled={!selectedSubjectId}
                  isLoading={addSubjectMutation.isPending}
                  onClick={() => addSubjectMutation.mutate(Number(selectedSubjectId))}
                >
                  Link
                </Button>
              </div>
            </Can>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Teacher assignments</h2>
            {assignments.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.assignmentId}>
                      <TableCell className="font-medium">{a.subjectName}</TableCell>
                      <TableCell>{a.teacherName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Can action="update" resource="classes">
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Subject"
                    options={classSubjects.map((cs) => ({ value: cs.classSubjectId, label: cs.subjectName }))}
                    value={selectedClassSubjectId}
                    onChange={(e) => setSelectedClassSubjectId(e.target.value)}
                    placeholder="Select a subject"
                  />
                </div>
                <div className="flex-1">
                  <Select
                    label="Teacher"
                    options={teachers.map((t) => ({ value: t.userId, label: t.fullName }))}
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    placeholder="Select a teacher"
                  />
                </div>
                <Button
                  disabled={!selectedClassSubjectId || !selectedTeacherId}
                  isLoading={assignTeacherMutation.isPending}
                  onClick={() =>
                    assignTeacherMutation.mutate({
                      classSubjectId: Number(selectedClassSubjectId),
                      teacherUserId: Number(selectedTeacherId),
                    })
                  }
                >
                  Assign
                </Button>
              </div>
            </Can>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Enrolled students</h2>
            {enrollments.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.enrollmentId}>
                      <TableCell>{e.rollNumber}</TableCell>
                      <TableCell className="font-medium">{e.studentName}</TableCell>
                      <TableCell>{e.enrollmentStatus}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Can action="update" resource="classes">
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Enroll a student"
                    options={enrollableStudents.map((s) => ({ value: s.userId, label: `${s.fullName} (${s.rollNumber})` }))}
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    placeholder="Select a student"
                  />
                </div>
                <Button
                  disabled={!selectedStudentId}
                  isLoading={enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate({ studentUserId: Number(selectedStudentId), classId })}
                >
                  Enroll
                </Button>
              </div>
            </Can>
          </Card>
        </>
      )}
    </div>
  );
}
