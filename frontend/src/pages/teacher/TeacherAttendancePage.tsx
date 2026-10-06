import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../../components/common';
import { markAttendance, getAttendanceByAssignment, getAttendanceRoster } from '../../api/attendance';
import { getTeacherAssignments } from '../../api/assignment';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

export function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { isPresent: boolean; remarks: string }>>({});

  const { data: assignmentsData } = useQuery({
    queryKey: queryKeys.teacherAssignments.all,
    queryFn: () => getTeacherAssignments(),
  });

  const { data: rosterData } = useQuery({
    queryKey: queryKeys.roster.attendance(selectedAssignment ?? undefined),
    queryFn: () => getAttendanceRoster(selectedAssignment!),
    enabled: !!selectedAssignment,
  });

  const { data: attendanceData } = useQuery({
    queryKey: queryKeys.attendance.byAssignment(selectedAssignment ?? undefined, selectedDate),
    queryFn: () =>
      getAttendanceByAssignment(selectedAssignment!, {
        startDate: selectedDate,
        endDate: selectedDate,
      }),
    enabled: !!selectedAssignment,
  });

  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      setAttendanceRecords({});
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      alert(message);
    },
  });

  const assignments = assignmentsData?.data || [];
  const roster = rosterData?.data || [];
  const attendance = attendanceData?.data || [];

  const setRecord = (studentUserId: number, field: 'isPresent' | 'remarks', value: boolean | string) => {
    setAttendanceRecords((prev) => {
      const existing = prev[studentUserId] ?? { isPresent: true, remarks: '' };
      return { ...prev, [studentUserId]: { ...existing, [field]: value } };
    });
  };

  const handleMarkAttendance = () => {
    if (!selectedAssignment) return;

    const studentAttendances = Object.entries(attendanceRecords).map(([studentId, record]) => ({
      studentUserId: parseInt(studentId),
      isPresent: record.isPresent,
      remarks: record.remarks || undefined,
    }));

    if (studentAttendances.length === 0) return;

    markMutation.mutate({
      assignmentId: selectedAssignment,
      recordDate: selectedDate,
      studentAttendances,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-slate-900">Mark attendance</h1>
          <p className="text-slate-500 text-sm">Record student attendance for your classes.</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Class-Subject"
              options={assignments.map((a) => ({
                value: a.assignmentId,
                label: `${a.className} - ${a.subjectName}`,
              }))}
              value={selectedAssignment?.toString() || ''}
              onChange={(e) => {
                setSelectedAssignment(e.target.value ? parseInt(e.target.value) : null);
                setAttendanceRecords({});
              }}
              placeholder="Select a class-subject"
            />
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {selectedAssignment && (
            <div className="mt-4">
              {roster.length === 0 ? (
                <div className="rounded border p-4">
                  <p className="text-sm text-slate-500">No students are enrolled in this class yet.</p>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-sm text-slate-600">Mark attendance for students. Click Present/Absent to toggle.</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((student) => {
                        const record = attendanceRecords[student.studentUserId];
                        const isPresent = record?.isPresent ?? true;
                        return (
                          <TableRow key={student.studentUserId}>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell className="font-medium">{student.fullName}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRecord(student.studentUserId, 'isPresent', true)}
                                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                    record && isPresent
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRecord(student.studentUserId, 'isPresent', false)}
                                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                    record && !isPresent
                                      ? 'bg-red-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  Absent
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={record?.remarks ?? ''}
                                onChange={(e) => setRecord(student.studentUserId, 'remarks', e.target.value)}
                                placeholder="Optional"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleMarkAttendance}
                  isLoading={markMutation.isPending}
                  disabled={Object.keys(attendanceRecords).length === 0}
                >
                  Submit attendance
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {attendance.length > 0 && (
        <Card noPadding title="Recent records">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.attendanceId}>
                  <TableCell>{record.recordDate}</TableCell>
                  <TableCell>{record.studentName}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        record.isPresent
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {record.isPresent ? 'Present' : 'Absent'}
                    </span>
                  </TableCell>
                  <TableCell>{record.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
