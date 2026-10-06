import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, DataTable, Loading } from '../../components/common';
import { getStudents } from '../../api/student';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import type { ColumnDef } from '@tanstack/react-table';

export function StudentListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.students.all,
    queryFn: () => getStudents(),
  });

  const students = data?.data || [];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Student',
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
               @{row.original.username}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'rollNumber',
      header: 'Roll no.',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">{row.original.rollNumber}</span>
          <span className="text-xs text-slate-400">{row.original.deptName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          row.original.isActive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.original.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {row.original.isActive ? 'Active' : 'Withdrawn'}
        </span>
      ),
    },
    {
      accessorKey: 'courseName',
      header: 'Course',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
           <span className="text-sm font-medium text-slate-700">{row.original.courseName}</span>
           <span className="text-xs text-sky-600 font-medium">Semester {row.original.currentSemester}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${row.original.userId}`)} className="font-medium text-xs hover:bg-slate-100 h-8">
            View profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Students</h1>
        </div>
        <Can action="create" resource="students">
          <Button onClick={() => navigate('/students/new')} className="px-5 h-10 font-medium text-sm">
            Add student
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
             <Loading size="lg" text="Loading students…" />
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={students}
            searchKey="fullName"
            searchPlaceholder="Search students..."
            filterComponent={
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Status</span>
                <select
                  className="bg-slate-50 border-none text-xs font-medium text-slate-900 rounded-lg h-8 focus:ring-0"
                  onChange={() => {
                    // Proof of concept for now
                  }}
                >
                  <option value="ALL">All students</option>
                  <option value="ACTIVE">Active</option>
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
