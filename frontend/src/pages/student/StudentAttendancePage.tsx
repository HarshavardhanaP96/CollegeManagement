import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, Loading, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common';
import { getMyAttendance } from '../../api/attendance';

export function StudentAttendancePage() {
  const [semester, setSemester] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['student-attendance', semester],
    queryFn: () => getMyAttendance({ semester }),
  });

  const attendanceData = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-slate-500 font-medium">View your academic attendance records and status.</p>
        </div>
        <Select
          options={[
            { value: '', label: 'All Semesters' },
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
        <Loading text="Loading attendance..." />
      ) : attendanceData ? (
        <div className="space-y-6">
          <Card title="Overall Attendance">
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-600">
                {attendanceData.overallAttendance.attendancePercentage.toFixed(2)}%
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {attendanceData.overallAttendance.classesAttended} / {attendanceData.overallAttendance.totalClasses} classes
              </p>
            </div>
          </Card>

          <Card noPadding title="Subject-wise Attendance" className="shadow-2xl shadow-slate-200/50">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
               <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Academic Progress: Subject Roster</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Classes Attended</TableHead>
                  <TableHead>Total Classes</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.subjectWiseAttendance.map((subject) => (
                  <TableRow key={subject.subjectId}>
                    <TableCell className="font-medium">{subject.subjectName}</TableCell>
                    <TableCell>{subject.subjectCode}</TableCell>
                    <TableCell>{subject.teacherName}</TableCell>
                    <TableCell>{subject.classesAttended}</TableCell>
                    <TableCell>{subject.totalClasses}</TableCell>
                    <TableCell>{subject.attendancePercentage.toFixed(2)}%</TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          subject.attendancePercentage >= 75
                            ? 'bg-green-100 text-green-800'
                            : subject.attendancePercentage >= 65
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subject.status}
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
