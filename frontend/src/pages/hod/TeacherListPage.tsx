import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getTeachers } from '../../api/teacher';
import type { ColumnDef } from '@tanstack/react-table';

export function TeacherListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => getTeachers(),
  });

  const teachers = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Educator Profile',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[12px] font-black text-white shadow-lg shadow-slate-200 transition-transform group-hover:scale-105">
            {row.original.fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.fullName}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ID: {row.original.employeeId || row.original.userId}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact Info',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-700">{row.original.email}</span>
          <span className="text-[11px] text-slate-500 font-bold tracking-tighter">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'qualification',
      header: 'Qualification',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 ring-1 ring-inset ring-slate-700/10 shadow-sm uppercase tracking-widest">
          {row.original.qualification || 'Not specified'}
        </span>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-[13px] font-bold text-sky-600">
          {row.original.specialization || 'General'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/teachers/${row.original.userId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty</h1>
        </div>
        <Button onClick={() => navigate('/teachers/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
          Onboard
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Syncing faculty..." />
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
