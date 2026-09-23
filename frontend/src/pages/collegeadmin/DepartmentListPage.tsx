import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getDepartments } from '../../api/department';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import type { ColumnDef } from '@tanstack/react-table';

export function DepartmentListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => getDepartments(),
  });

  const departments = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'deptName',
      header: 'Department Name',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.deptName}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {row.original.deptId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'deptCode',
      header: 'Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 ring-1 ring-inset ring-slate-700/10 shadow-sm uppercase tracking-widest">
          {row.original.deptCode}
        </span>
      ),
    },
    {
      accessorKey: 'deptHeadName',
      header: 'HOD',
      enableSorting: true,
      cell: ({ row }) => (
        row.original.deptHeadName ? (
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-700">{row.original.deptHeadName}</span>
            <span className="text-[10px] text-sky-600 font-black uppercase tracking-tight">Assigned Head</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-300 italic">Unassigned</span>
        )
      ),
    },
    {
      header: 'Metrics',
      enableSorting: true,
      accessorFn: (row) => row.totalStudents + row.totalTeachers,
      cell: ({ row }) => (
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {row.original.totalTeachers || 0} Faculty
           </span>
           <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {row.original.totalStudents || 0} Students
           </span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/departments/${row.original.deptId}`)} className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-8">
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Units</h1>
        </div>
        <Can action="create" resource="departments">
          <Button onClick={() => navigate('/departments/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
            Establish
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Syncing structure..." />
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={departments} 
            searchKey="deptName" 
            searchPlaceholder="Filter departments..."
          />
        )}
      </div>
    </div>
  );
}
