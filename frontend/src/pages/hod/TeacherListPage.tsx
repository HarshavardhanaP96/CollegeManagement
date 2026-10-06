import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getTeachers } from '../../api/teacher';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import type { ColumnDef } from '@tanstack/react-table';

export function TeacherListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.teachers.all,
    queryFn: () => getTeachers(),
  });

  const teachers = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Teacher',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {row.original.fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.fullName}</span>
            <span className="text-xs text-slate-400">
              ID {row.original.employeeId || row.original.userId}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">{row.original.email}</span>
          <span className="text-xs text-slate-500">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qualification',
      header: 'Qualification',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {row.original.qualification || 'Not specified'}
        </span>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-sky-600">
          {row.original.specialization || 'General'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/teachers/${row.original.userId}`)} className="font-medium text-xs hover:bg-slate-100 h-8">
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
          <h1 className="font-display text-2xl font-semibold text-slate-900">Teachers</h1>
        </div>
        <Can action="create" resource="teachers">
          <Button onClick={() => navigate('/teachers/new')} className="px-5 h-10 font-medium text-sm">
            Add teacher
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Loading teachers…" />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={teachers} 
            searchKey="fullName" 
            searchPlaceholder="Search faculty members..."
          />
        )}
      </div>
    </div>
  );
}
