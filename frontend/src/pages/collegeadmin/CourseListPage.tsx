import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getCourses } from '../../api/course';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import type { ColumnDef } from '@tanstack/react-table';

export function CourseListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => getCourses(),
  });

  const courses = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'courseName',
      header: 'Course',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.courseName}</div>
          <div className="text-xs text-slate-400">ID {row.original.courseId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'courseCode',
      header: 'Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
          {row.original.courseCode}
        </span>
      ),
    },
    {
      accessorKey: 'durationYears',
      header: 'Duration',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">{row.original.durationYears} years</span>
          <span className="text-xs text-slate-400">{row.original.totalSemesters} semesters</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalStudents',
      header: 'Enrollment',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {row.original.totalStudents || 0} students
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${row.original.courseId}`)} className="font-medium text-xs hover:bg-slate-100 h-8">
            Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Courses</h1>
        </div>
        <Can action="create" resource="courses">
          <Button onClick={() => navigate('/courses/new')} className="px-5 h-10 font-medium text-sm">
            Add course
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Loading courses…" />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={courses} 
            searchKey="courseName" 
            searchPlaceholder="Filter curricula..."
          />
        )}
      </div>
    </div>
  );
}
