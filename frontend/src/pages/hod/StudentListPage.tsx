import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getStudents } from '../../api/student';
import type { ColumnDef } from '@tanstack/react-table';

export function StudentListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => getStudents(),
  });

  const students = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Scholar Profile',
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               @{row.original.username}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'rollNumber',
      header: 'Academic Identity',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-700">{row.original.rollNumber}</span>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{row.original.deptName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
          row.original.isActive 
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
          : 'bg-red-50 text-red-700 ring-red-600/20'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.original.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {row.original.isActive ? 'Active' : 'Withdrawn'}
        </span>
      ),
    },
    {
      accessorKey: 'courseName',
      header: 'Program & Term',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
           <span className="text-[13px] font-bold text-slate-700">{row.original.courseName}</span>
           <span className="text-[11px] text-sky-600 font-black uppercase tracking-widest">Sem {row.original.currentSemester}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${row.original.userId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
            Profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registry</h1>
        </div>
        <Button onClick={() => navigate('/students/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
          Enroll
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Syncing records..." />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={students} 
            searchKey="fullName" 
            searchPlaceholder="Search scholars..."
            filterComponent={
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
                <select 
                  className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-lg h-8 focus:ring-0"
                  onChange={() => {
                    // Proof of concept for now
                  }}
                >
                  <option value="ALL">All Scholars</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
