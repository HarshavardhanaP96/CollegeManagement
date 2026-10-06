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
      header: 'Department',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="group cursor-pointer">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{row.original.deptName}</div>
          <div className="text-xs text-slate-400">ID {row.original.deptId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'deptCode',
      header: 'Code',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
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
            <span className="text-sm font-medium text-slate-700">{row.original.deptHeadName}</span>
            <span className="text-xs text-sky-600">Head of department</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-400 italic">Unassigned</span>
        )
      ),
    },
    {
      header: 'Headcount',
      enableSorting: true,
      accessorFn: (row) => row.totalStudents + row.totalTeachers,
      cell: ({ row }) => (
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {row.original.totalTeachers || 0} teachers
           </span>
           <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {row.original.totalStudents || 0} students
           </span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/departments/${row.original.deptId}`)} className="font-medium text-xs hover:bg-slate-100 h-8">
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
          <h1 className="font-display text-2xl font-semibold text-slate-900">Departments</h1>
        </div>
        <Can action="create" resource="departments">
          <Button onClick={() => navigate('/departments/new')} className="px-5 h-10 font-medium text-sm">
            Add department
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Loading departments…" />
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
