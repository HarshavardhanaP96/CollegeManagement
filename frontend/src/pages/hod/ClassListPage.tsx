import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getClasses, getCourses } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import type { ColumnDef } from '@tanstack/react-table';

export function ClassListPage() {
  const navigate = useNavigate();

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: queryKeys.classes.all,
    queryFn: () => getClasses(),
  });

  // ClassResponseDTO only carries courseId, not a course name — join against the
  // courses list (already fetched/cached elsewhere) to show something readable.
  const { data: coursesData } = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => getCourses(),
  });
  const courseNameById = new Map((coursesData?.data || []).map((c) => [c.courseId, c.courseName]));

  const classes = classesData?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'className',
      header: 'Class',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.className}</div>
          <div className="text-xs text-slate-400">ID CLS-{row.original.classId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'academicYear',
      header: 'Term & section',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">{row.original.academicYear}</span>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">Sem {row.original.semester}</span>
             <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">Sec {row.original.section}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'courseId',
      header: 'Course',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700">
          {courseNameById.get(row.original.courseId) || `Course #${row.original.courseId}`}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/classes/${row.original.classId}`)} className="font-medium text-xs hover:bg-slate-100 h-8">
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
          <h1 className="font-display text-2xl font-semibold text-slate-900">Classes</h1>
        </div>
        <Can action="create" resource="classes">
          <Button onClick={() => navigate('/classes/new')} className="px-5 h-10 font-medium text-sm">
            Add class
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {classesLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Loading classes…" />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={classes} 
            searchKey="className" 
            searchPlaceholder="Filter cohorts..."
          />
        )}
      </div>
    </div>
  );
}
