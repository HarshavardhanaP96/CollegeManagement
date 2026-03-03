import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getColleges, type CollegeListItem } from '../../api/college';
import { Card, Button, DataTable, Loading } from '../../components/common';
import type { ColumnDef } from '@tanstack/react-table';

export function CollegeListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => getColleges({ page: 0, size: 100 }),
  });

  const colleges = data?.data?.content || [];

  const columns: ColumnDef<CollegeListItem>[] = [
    {
      accessorKey: 'collegeName',
      header: 'Institution',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.collegeName}</span>
          <span className="text-[10px] items-center text-slate-400 gap-1 flex font-black uppercase tracking-widest">
            ID: {row.original.collegeId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'collegeCode',
      header: 'Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-inset ring-slate-700/10 uppercase tracking-widest">
          {row.original.collegeCode}
        </span>
      ),
    },
    {
      accessorKey: 'contactEmail',
      header: 'Primary Contact',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-700">{row.original.contactEmail}</span>
          <span className="text-[11px] text-slate-500 font-bold tracking-tighter">{row.original.contactPhone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalStudents',
      header: 'Capacity',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-slate-900">{row.original.totalStudents || 0} Scholars</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{row.original.totalDepartments || 0} Academic Units</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/colleges/${row.original.collegeId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutions</h1>
        </div>
        <Button onClick={() => navigate('/colleges/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
          Register
        </Button>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Synchronizing..." />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={colleges} 
            searchKey="collegeName" 
            searchPlaceholder="Filter registry..."
          />
        )}
      </div>
    </div>
  );
}
