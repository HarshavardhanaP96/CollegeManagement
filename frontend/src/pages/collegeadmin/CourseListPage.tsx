import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getCourses } from '../../api/course';
import type { ColumnDef } from '@tanstack/react-table';

export function CourseListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses(),
  });

  const courses = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'courseName',
      header: 'Degree & Program',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.courseName}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {row.original.courseId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'courseCode',
      header: 'Curriculum Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700 ring-1 ring-inset ring-sky-700/10 shadow-sm uppercase tracking-widest">
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
          <span className="text-[13px] font-bold text-slate-700">{row.original.durationYears} Academic Years</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{row.original.totalSemesters} Semesters Total</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalStudents',
      header: 'Enrollment',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {row.original.totalStudents || 0} Registered
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${row.original.courseId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
            Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Programs</h1>
        </div>
        <Button onClick={() => navigate('/courses/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
          Formulate
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Calibrating..." />
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
