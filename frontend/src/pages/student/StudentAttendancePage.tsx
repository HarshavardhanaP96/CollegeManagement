import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, Loading, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common';
import { getMyAttendance } from '../../api/attendance';
import { queryKeys } from '../../api/queryKeys';

export function StudentAttendancePage() {
  const [semester, setSemester] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.studentAttendance.bySemester(semester),
    queryFn: () => getMyAttendance({ semester }),
  });

  const attendanceData = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-slate-900">My attendance</h1>
          <p className="text-slate-500 text-sm">View your attendance records by subject.</p>
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
        <Loading text="Loading attendance…" />
      ) : attendanceData ? (
        <div className="space-y-6">
          <Card title="Overall attendance">
            <div className="text-center">
              <p className="font-display text-3xl font-semibold text-sky-600">
                {attendanceData.overallAttendance.toFixed(2)}%
              </p>
            </div>
          </Card>

          <Card noPadding title="By subject">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Total classes</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.subjectAttendances.map((subject) => (
                  <TableRow key={subject.subjectId}>
                    <TableCell className="font-medium text-slate-900">{subject.subjectName}</TableCell>
                    <TableCell>{subject.presentCount}</TableCell>
                    <TableCell>{subject.absentCount}</TableCell>
                    <TableCell>{subject.totalClasses}</TableCell>
                    <TableCell>{subject.attendancePercentage.toFixed(2)}%</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          subject.attendancePercentage >= 75
                            ? 'bg-emerald-50 text-emerald-700'
                            : subject.attendancePercentage >= 65
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {subject.attendancePercentage >= 75 ? 'Good' : subject.attendancePercentage >= 65 ? 'Warning' : 'Low'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : (
        <Card>
          <p className="text-center text-slate-500">No attendance records found</p>
        </Card>
      )}
    </div>
  );
}
