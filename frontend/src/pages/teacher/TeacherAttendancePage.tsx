import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Select, Input } from '../../components/common';
import { markAttendance, getAttendanceByAssignment, getAttendanceRoster } from '../../api/attendance';
import type { AttendanceRosterStudent } from '../../api/attendance';
import { getTeacherAssignments } from '../../api/assignment';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

type Mark = { isPresent: boolean; remarks: string };

const ROW_SIZE = 10;

/** Ticks or clears a group of students; shows a dash when the group is mixed. */
function GroupCheckbox({ label, students, markOf, onChange }: {
  label: string;
  students: AttendanceRosterStudent[];
  markOf: (studentUserId: number) => Mark;
  onChange: (students: AttendanceRosterStudent[], isPresent: boolean) => void;
}) {
  const present = students.filter((s) => markOf(s.studentUserId).isPresent).length;
  const all = students.length > 0 && present === students.length;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        className="h-4 w-4 accent-emerald-600"
        checked={all}
        ref={(el) => {
          if (el) el.indeterminate = present > 0 && !all;
        }}
        onChange={(e) => onChange(students, e.target.checked)}
      />
      {label}
    </label>
  );
}

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

  const markGroup = (students: AttendanceRosterStudent[], isPresent: boolean) => {
    setSavedMessage('');
    setEdits((prev) => ({
      ...prev,
      ...Object.fromEntries(students.map((s) => [s.studentUserId, { ...markOf(s.studentUserId), isPresent }])),
    }));
  };

  const rows = Array.from({ length: Math.ceil(roster.length / ROW_SIZE) }, (_, i) =>
    roster.slice(i * ROW_SIZE, (i + 1) * ROW_SIZE),
  );

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
          <p className="text-slate-500 text-sm">Ticked means present. Everyone starts ticked: untick the absentees, or a whole row, and save.</p>
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
                    <GroupCheckbox label="Select all" students={roster} markOf={markOf} onChange={markGroup} />
                  </div>
                  <div className="space-y-2">
                    {rows.map((row, i) => (
                      <div key={i} className="flex flex-col gap-1 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:gap-3">
                        <div className="sm:w-16 sm:shrink-0 sm:pt-1">
                          <GroupCheckbox label={`Row ${i + 1}`} students={row} markOf={markOf} onChange={markGroup} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {row.map((student) => {
                            const { isPresent } = markOf(student.studentUserId);
                            return (
                              <label
                                key={student.studentUserId}
                                title={student.fullName}
                                className={`flex w-16 cursor-pointer flex-col items-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                                  isPresent ? 'text-slate-700 hover:bg-slate-50' : 'bg-red-50 text-red-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 accent-emerald-600"
                                  aria-label={`${student.rollNumber} ${student.fullName}`}
                                  checked={isPresent}
                                  onChange={(e) => setRecord(student.studentUserId, 'isPresent', e.target.checked)}
                                />
                                <span className="max-w-full truncate px-1">{student.rollNumber ?? student.studentUserId}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
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
