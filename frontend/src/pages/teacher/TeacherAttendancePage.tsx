import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../../components/common';
import { markAttendance, getAttendanceByAssignment, getAttendanceRoster } from '../../api/attendance';
import { getTeacherAssignments } from '../../api/assignment';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

type Mark = { isPresent: boolean; remarks: string };

export function TeacherAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  // Only the teacher's unsaved changes; everything else comes from the saved register or defaults to present.
  const [edits, setEdits] = useState<Record<number, Mark>>({});
  const [savedMessage, setSavedMessage] = useState('');

  const { data: assignmentsData } = useQuery({
    queryKey: queryKeys.teacherAssignments.all,
    queryFn: () => getTeacherAssignments(),
  });

  const { data: rosterData } = useQuery({
    queryKey: queryKeys.roster.attendance(selectedAssignment ?? undefined),
    queryFn: () => getAttendanceRoster(selectedAssignment!),
    enabled: !!selectedAssignment,
  });

  const { data: attendanceData, isLoading: isLoadingSaved } = useQuery({
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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      setEdits({});
      setSavedMessage(`Saved: ${res.data.presentCount} present, ${res.data.absentCount} absent.`);
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      alert(message);
    },
  });

  const assignments = assignmentsData?.data || [];
  const roster = rosterData?.data || [];
  const saved: Record<number, Mark> = Object.fromEntries(
    (attendanceData?.data || []).map((r) => [r.studentUserId, { isPresent: r.isPresent, remarks: r.remarks ?? '' }]),
  );
  const isUpdate = Object.keys(saved).length > 0;
  const hasEdits = Object.keys(edits).length > 0;

  const markOf = (studentUserId: number): Mark =>
    edits[studentUserId] ?? saved[studentUserId] ?? { isPresent: true, remarks: '' };

  const presentCount = roster.filter((s) => markOf(s.studentUserId).isPresent).length;
  const absentCount = roster.length - presentCount;

  const resetEdits = () => {
    setEdits({});
    setSavedMessage('');
  };

  const setRecord = (studentUserId: number, field: keyof Mark, value: boolean | string) => {
    setSavedMessage('');
    setEdits((prev) => ({ ...prev, [studentUserId]: { ...markOf(studentUserId), [field]: value } }));
  };

  const markAll = (isPresent: boolean) => {
    setSavedMessage('');
    setEdits(Object.fromEntries(roster.map((s) => [s.studentUserId, { ...markOf(s.studentUserId), isPresent }])));
  };

  const handleSave = () => {
    if (!selectedAssignment || roster.length === 0) return;

    markMutation.mutate({
      assignmentId: selectedAssignment,
      recordDate: selectedDate,
      studentAttendances: roster.map((s) => {
        const mark = markOf(s.studentUserId);
        return { studentUserId: s.studentUserId, isPresent: mark.isPresent, remarks: mark.remarks || undefined };
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-slate-900">Mark attendance</h1>
          <p className="text-slate-500 text-sm">Everyone starts as present. Mark the absentees and save.</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Select Class-Subject"
              options={assignments.map((a) => ({
                value: a.assignmentId,
                label: `${a.className} - ${a.subjectName}`,
              }))}
              value={selectedAssignment?.toString() || ''}
              onChange={(e) => {
                setSelectedAssignment(e.target.value ? parseInt(e.target.value) : null);
                resetEdits();
              }}
              placeholder="Select a class-subject"
            />
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                resetEdits();
              }}
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
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-sm" aria-live="polite">
                      <span className="font-semibold text-emerald-700">{presentCount} present</span>
                      <span className="font-semibold text-red-700">{absentCount} absent</span>
                      <span className="text-slate-500">of {roster.length}</span>
                      {isUpdate && !hasEdits && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">Already saved for this date</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => markAll(true)}>
                        Mark all present
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => markAll(false)}>
                        Mark all absent
                      </Button>
                    </div>
                  </div>
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
                        const { isPresent, remarks } = markOf(student.studentUserId);
                        return (
                          <TableRow key={student.studentUserId} className={isPresent ? undefined : 'bg-red-50/60'}>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell className="font-medium">{student.fullName}</TableCell>
                            <TableCell>
                              <div className="flex gap-2" role="group" aria-label={`Attendance for ${student.fullName}`}>
                                <button
                                  type="button"
                                  aria-pressed={isPresent}
                                  onClick={() => setRecord(student.studentUserId, 'isPresent', true)}
                                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                    isPresent
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  aria-pressed={!isPresent}
                                  onClick={() => setRecord(student.studentUserId, 'isPresent', false)}
                                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                    !isPresent
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
                                value={remarks}
                                onChange={(e) => setRecord(student.studentUserId, 'remarks', e.target.value)}
                                placeholder="Optional"
                                aria-label={`Remarks for ${student.fullName}`}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
              <div className="mt-4 flex items-center justify-end gap-4">
                {savedMessage && <p className="text-sm text-emerald-700" role="status">{savedMessage}</p>}
                <Button
                  onClick={handleSave}
                  isLoading={markMutation.isPending}
                  disabled={roster.length === 0 || isLoadingSaved || (isUpdate && !hasEdits)}
                >
                  {isUpdate ? 'Update attendance' : `Save attendance (${roster.length})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
