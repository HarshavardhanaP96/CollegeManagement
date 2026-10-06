import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, Loading, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common';
import { getMyMarks } from '../../api/marks';
import { queryKeys } from '../../api/queryKeys';

export function StudentMarksPage() {
  const [semester, setSemester] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.studentMarks.bySemester(semester),
    queryFn: () => getMyMarks({ semester }),
  });

  const marksData = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-slate-900">My marks</h1>
          <p className="text-slate-500 text-sm">View your exam results by subject.</p>
        </div>
        <Select
          options={[
            { value: '', label: 'All semesters' },
            { value: '1', label: 'Semester 1' },
            { value: '2', label: 'Semester 2' },
            { value: '3', label: 'Semester 3' },
            { value: '4', label: 'Semester 4' },
            { value: '5', label: 'Semester 5' },
            { value: '6', label: 'Semester 6' },
            { value: '7', label: 'Semester 7' },
            { value: '8', label: 'Semester 8' },
          ]}
          value={semester?.toString() || ''}
          onChange={(e) => setSemester(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-48"
        />
      </div>

      {isLoading ? (
        <Loading text="Loading marks…" />
      ) : marksData ? (
        <div className="space-y-6">
          {marksData.subjectMarks.map((subject) => (
            <Card key={subject.subjectId} noPadding title={`${subject.subjectName} (${subject.subjectCode})`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam type</TableHead>
                    <TableHead>Marks obtained</TableHead>
                    <TableHead>Maximum marks</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subject.examMarks.map((exam, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{exam.examTypeName}</TableCell>
                      <TableCell>{exam.marksObtained}</TableCell>
                      <TableCell>{exam.maxMarks}</TableCell>
                      <TableCell>{exam.percentage.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell>Overall</TableCell>
                    <TableCell>{subject.totalMarks}</TableCell>
                    <TableCell>{subject.totalMaxMarks}</TableCell>
                    <TableCell>{subject.percentage.toFixed(2)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          ))}
          {marksData.subjectMarks.length > 0 && (
            <Card>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  Overall Percentage: {marksData.overallPercentage.toFixed(2)}% (Grade {marksData.grade})
                </p>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <p className="text-center text-slate-500">No marks found</p>
        </Card>
      )}
    </div>
  );
}
