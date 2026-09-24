import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../../components/common';
import { enterMarks, getMarksByAssignment, getRoster } from '../../api/marks';
import { getTeacherAssignments } from '../../api/assignment';
import { getExamTypes } from '../../api/examType';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

export function TeacherMarksPage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [examTypeId, setExamTypeId] = useState<number | null>(null);
  const [marksEntries, setMarksEntries] = useState<Record<number, { marksObtained: string; remarks: string }>>({});

  const { data: assignmentsData } = useQuery({
    queryKey: queryKeys.teacherAssignments.all,
    queryFn: () => getTeacherAssignments(),
  });

  const { data: examTypesData } = useQuery({
    queryKey: queryKeys.examTypes.all,
    queryFn: () => getExamTypes(),
  });

  const { data: rosterData } = useQuery({
    queryKey: queryKeys.roster.marks(selectedAssignment ?? undefined),
    queryFn: () => getRoster(selectedAssignment!),
    enabled: !!selectedAssignment,
  });

  const { data: marksData } = useQuery({
    queryKey: queryKeys.marks.byAssignment(selectedAssignment ?? undefined, examTypeId ?? undefined),
    queryFn: () => getMarksByAssignment(selectedAssignment!, { examTypeId: examTypeId ?? undefined }),
    enabled: !!selectedAssignment,
  });

  const enterMarksMutation = useMutation({
    mutationFn: enterMarks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.marks.all });
      setMarksEntries({});
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      alert(message);
    },
  });

  const assignments = assignmentsData?.data || [];
  const examTypes = examTypesData?.data || [];
  const roster = rosterData?.data || [];
  const marks = marksData?.data || [];
  const selectedExamType = examTypes.find((et) => et.examTypeId === examTypeId);

  const setEntry = (studentUserId: number, field: 'marksObtained' | 'remarks', value: string) => {
    setMarksEntries((prev) => {
      const existing = prev[studentUserId] ?? { marksObtained: '', remarks: '' };
      return { ...prev, [studentUserId]: { ...existing, [field]: value } };
    });
  };

  const handleEnterMarks = () => {
    if (!selectedAssignment || !examTypeId) return;

    const studentMarks = Object.entries(marksEntries)
      .filter(([, entry]) => entry.marksObtained !== '')
      .map(([studentId, entry]) => ({
        studentUserId: parseInt(studentId),
        marksObtained: parseFloat(entry.marksObtained),
        remarks: entry.remarks || undefined,
      }));

    if (studentMarks.length === 0) return;

    enterMarksMutation.mutate({
      assignmentId: selectedAssignment,
      examTypeId,
      studentMarks,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enter Marks</h1>
          <p className="text-slate-500 font-medium">Evaluate and record academic results for your assigned students.</p>
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
                setMarksEntries({});
              }}
              placeholder="Select a class-subject"
            />
            <Select
              label="Exam Type"
              options={examTypes.map((et) => ({
                value: et.examTypeId,
                label: `${et.examTypeName} (max ${et.maxMarks})`,
              }))}
              value={examTypeId?.toString() || ''}
              onChange={(e) => {
                setExamTypeId(e.target.value ? parseInt(e.target.value) : null);
                setMarksEntries({});
              }}
              placeholder="Select an exam type"
            />
          </div>

          {selectedAssignment && examTypeId && (
            <div className="mt-4">
              {roster.length === 0 ? (
                <div className="rounded border p-4">
                  <p className="text-sm text-slate-500">No students are enrolled in this class yet.</p>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-sm text-slate-600">
                    Enter marks for students. Marks cannot exceed {selectedExamType?.maxMarks ?? '-'}.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Marks Obtained</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((student) => (
                        <TableRow key={student.studentUserId}>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell className="font-medium">{student.fullName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={selectedExamType?.maxMarks}
                              value={marksEntries[student.studentUserId]?.marksObtained ?? ''}
                              onChange={(e) => setEntry(student.studentUserId, 'marksObtained', e.target.value)}
                              placeholder="0"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={marksEntries[student.studentUserId]?.remarks ?? ''}
                              onChange={(e) => setEntry(student.studentUserId, 'remarks', e.target.value)}
                              placeholder="Optional"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleEnterMarks}
                  isLoading={enterMarksMutation.isPending}
                  disabled={Object.values(marksEntries).every((e) => !e.marksObtained)}
                >
                  Submit Marks
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {marks.length > 0 && (
        <Card noPadding className="shadow-2xl shadow-slate-200/50">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
             <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Marks</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam Type</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Max Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((mark) => (
                <TableRow key={mark.markId}>
                  <TableCell className="font-medium">{mark.studentName}</TableCell>
                  <TableCell>{mark.examTypeName}</TableCell>
                  <TableCell>{mark.marksObtained}</TableCell>
                  <TableCell>{mark.maxMarks}</TableCell>
                  <TableCell>{((mark.marksObtained / mark.maxMarks) * 100).toFixed(2)}%</TableCell>
                  <TableCell>{mark.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
