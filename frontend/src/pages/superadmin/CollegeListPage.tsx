import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCollege, getColleges, type CollegeListItem } from '../../api/college';
import { getErrorMessage } from '../../api/client';

const createCollegeSchema = z.object({
  collegeName: z.string().min(1, 'College name is required'),
  collegeCode: z.string().min(1, 'College code is required'),
  address: z.string().min(1, 'Address is required'),
  contactEmail: z.string().email('Invalid email format'),
  contactPhone: z.string().min(5, 'Contact phone is required'),
});

type CreateCollegeFormValues = z.infer<typeof createCollegeSchema>;

export function CollegeListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['colleges', { page, size, search }],
    queryFn: () => getColleges({ page, size, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCollegeFormValues>({
    resolver: zodResolver(createCollegeSchema),
  });

  const createMutation = useMutation({
    mutationFn: createCollege,
    onSuccess: () => {
      reset();
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (values: CreateCollegeFormValues) => {
    setServerError(null);
    createMutation.mutate(values);
  };

  const columns: ColumnDef<CollegeListItem>[] = [
    {
      header: 'Name',
      accessorKey: 'collegeName',
    },
    {
      header: 'Code',
      accessorKey: 'collegeCode',
    },
    {
      header: 'Email',
      accessorKey: 'contactEmail',
    },
    {
      header: 'Phone',
      accessorKey: 'contactPhone',
    },
    {
      header: 'Departments',
      accessorKey: 'totalDepartments',
    },
    {
      header: 'Students',
      accessorKey: 'totalStudents',
    },
    {
      header: 'Teachers',
      accessorKey: 'totalTeachers',
    },
  ];

  const table = useReactTable({
    data: data?.data.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = data?.data.pageable.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Colleges</h1>
          <p className="text-sm text-slate-600">
            Manage colleges (SuperAdmin only). Backend validation and error responses are shown
            inline.
          </p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code"
              className="w-64 rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-slate-50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-3 py-2 text-left font-semibold">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-4 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-4 text-center text-slate-500">
                      No colleges found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Create College</h2>

          {serverError && (
            <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block font-medium" htmlFor="collegeName">
                College Name
              </label>
              <input
                id="collegeName"
                type="text"
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('collegeName')}
              />
              {errors.collegeName && (
                <p className="mt-1 text-xs text-red-600">{errors.collegeName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium" htmlFor="collegeCode">
                College Code
              </label>
              <input
                id="collegeCode"
                type="text"
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('collegeCode')}
              />
              {errors.collegeCode && (
                <p className="mt-1 text-xs text-red-600">{errors.collegeCode.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('address')}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium" htmlFor="contactEmail">
                Contact Email
              </label>
              <input
                id="contactEmail"
                type="email"
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('contactEmail')}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium" htmlFor="contactPhone">
                Contact Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('contactPhone')}
              />
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-1 w-full rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createMutation.isPending ? 'Creating...' : 'Create College'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}


