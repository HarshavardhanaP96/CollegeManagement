import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getClasses } from '../../api';
import type { ColumnDef } from '@tanstack/react-table';

export function ClassListPage() {
  const navigate = useNavigate();

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => getClasses(),
  });

  const classes = classesData?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'className',
      header: 'Class / Alias',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.className}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">ID: CLS-{row.original.classId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'academicYear',
      header: 'Term & Section',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-700">{row.original.academicYear}</span>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[10px] font-black uppercase tracking-tighter text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">Sem {row.original.semester}</span>
             <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">Sec {row.original.section}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'courseName',
      header: 'Degree Path',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-[13px] font-black text-slate-700">{row.original.courseName}</span>
      ),
    },
    {
      header: 'Metrics',
      enableSorting: true,
      accessorFn: (row) => row.totalStudents,
      cell: ({ row }) => (
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {row.original.totalStudents || 0} Students
           </span>
           <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {row.original.totalSubjects || 0} Subjects
           </span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/classes/${row.original.classId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cohorts</h1>
        </div>
        <Button onClick={() => navigate('/classes/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
          Instantiate
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        {classesLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Mapping structure..." />
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
