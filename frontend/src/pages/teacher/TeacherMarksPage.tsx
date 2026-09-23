import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../../components/common';
import { getTeacherAssignments, enterMarks, getMarksByAssignment } from '../../api';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

export function TeacherMarksPage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [examTypeId, setExamTypeId] = useState<number | null>(null);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [marksEntries, setMarksEntries] = useState<Record<number, { marksObtained: number; remarks: string }>>({});

  const { data: assignmentsData } = useQuery({
    queryKey: queryKeys.teacherAssignments.all,
    queryFn: () => getTeacherAssignments(),
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
  const marks = marksData?.data || [];

  const handleEnterMarks = () => {
    if (!selectedAssignment || !examTypeId) return;

    const entries = Object.entries(marksEntries).map(([studentId, entry]) => ({
      studentUserId: parseInt(studentId),
      marksObtained: entry.marksObtained,
      remarks: entry.remarks || undefined,
    }));

    enterMarksMutation.mutate({
      assignmentId: selectedAssignment,
      examTypeId,
      marksEntries: entries,
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
            <Input
              label="Exam Type ID"
              type="number"
              value={examTypeId || ''}
              onChange={(e) => setExamTypeId(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Enter exam type ID"
            />
          </div>
          <Input
            label="Maximum Marks"
            type="number"
            value={maxMarks}
            onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
          />

          {selectedAssignment && examTypeId && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-600">
                Enter marks for students. Marks cannot exceed {maxMarks}.
              </p>
              <div className="rounded border p-4">
                <p className="text-sm text-slate-500">
                  Note: Student list will be loaded from the backend when entering marks.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleEnterMarks}
                  isLoading={enterMarksMutation.isPending}
                  disabled={Object.keys(marksEntries).length === 0}
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
                  <TableCell>{mark.percentage.toFixed(2)}%</TableCell>
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
