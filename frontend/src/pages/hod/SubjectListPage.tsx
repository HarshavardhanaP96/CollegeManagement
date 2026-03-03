import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getSubjects } from '../../api/subject';
import type { ColumnDef } from '@tanstack/react-table';

export function SubjectListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
  });

  const subjects = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'subjectName',
      header: 'Catalog Entry',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.subjectName}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">ID: SUB-{row.original.subjectId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'subjectCode',
      header: 'Subject Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 ring-1 ring-inset ring-slate-700/10 shadow-sm uppercase tracking-widest">
          {row.original.subjectCode}
        </span>
      ),
    },
    {
      accessorKey: 'credits',
      header: 'Weightage',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-[14px] font-black text-slate-700">{row.original.credits}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter self-end mb-0.5">Points</span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectType',
      header: 'Classification',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
          row.original.subjectType === 'Theory' 
          ? 'bg-sky-50 text-sky-700 ring-sky-700/10' 
          : 'bg-indigo-50 text-indigo-700 ring-indigo-700/10'
        }`}>
          {row.original.subjectType}
        </span>
      ),
    },
    {
      header: 'Utilization',
      enableSorting: true,
      accessorFn: (row) => row.totalClasses,
      cell: ({ row }) => (
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {row.original.totalClasses || 0} Classes
           </span>
           <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {row.original.totalTeachersAssigned || 0} Faculty
           </span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/subjects/${row.original.subjectId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Syllabus</h1>
        </div>
        <Button onClick={() => navigate('/subjects/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
          Induct
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Syncing catalog..." />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={subjects} 
            searchKey="subjectName" 
            searchPlaceholder="Filter entries..."
          />
        )}
      </div>
    </div>
  );
}
