import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getSubjects } from '../../api/subject';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import type { ColumnDef } from '@tanstack/react-table';

export function SubjectListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => getSubjects(),
  });

  const subjects = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'subjectName',
      header: 'Subject',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.subjectName}</div>
          <div className="text-xs text-slate-400">ID SUB-{row.original.subjectId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'subjectCode',
      header: 'Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {row.original.subjectCode}
        </span>
      ),
    },
    {
      accessorKey: 'credits',
      header: 'Credits',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-700">{row.original.credits}</span>
          <span className="text-xs text-slate-400">points</span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectType',
      header: 'Type',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          row.original.subjectType === 'Theory'
          ? 'bg-sky-50 text-sky-700'
          : 'bg-indigo-50 text-indigo-700'
        }`}>
          {row.original.subjectType}
        </span>
      ),
    },
    {
      header: 'Usage',
      enableSorting: true,
      accessorFn: (row) => row.totalClasses,
      cell: ({ row }) => (
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {row.original.totalClasses || 0} classes
           </span>
           <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {row.original.totalTeachersAssigned || 0} teachers
           </span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/subjects/${row.original.subjectId}`)} className="font-medium text-xs hover:bg-slate-100 h-8">
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Subjects</h1>
        </div>
        <Can action="create" resource="subjects">
          <Button onClick={() => navigate('/subjects/new')} className="px-5 h-10 font-medium text-sm">
            Add subject
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Loading subjects…" />
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
