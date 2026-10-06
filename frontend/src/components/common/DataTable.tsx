import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
import { Input } from './Input';
import { Button } from './Button';
import { clsx } from 'clsx';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterComponent?: ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  filterComponent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col bg-white h-full w-full rounded-lg overflow-hidden border border-slate-200">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex-1 max-w-xl">
          {searchKey && (
            <div className="relative group/search">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-3.5 w-3.5 transition-colors group-focus-within/search:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-10 pr-10 h-10 border-slate-200 bg-slate-50/50 shadow-none ring-sky-500/10 focus:ring-4 focus:bg-white transition-all text-xs"
              />
              {globalFilter && (
                <button 
                   onClick={() => setGlobalFilter('')}
                   className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        {filterComponent && <div className="flex items-center gap-3">{filterComponent}</div>}
      </div>

      {/* Fixed Height Table Container */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white">
        <Table className="min-w-full table-fixed">
          <TableHeader className="sticky top-0 z-20 shadow-sm border-b-2 border-slate-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50 border-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={clsx(
                      "px-6 py-3.5 text-slate-500 font-semibold text-xs transition-colors",
                      header.column.getCanSort() && "cursor-pointer hover:text-slate-900"
                    )}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                           {header.column.getIsSorted() === 'asc' ? (
                             <svg className="h-2.5 w-2.5 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z"/></svg>
                           ) : header.column.getIsSorted() === 'desc' ? (
                             <svg className="h-2.5 w-2.5 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4z"/></svg>
                           ) : (
                             <svg className="h-2.5 w-2.5 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-4 4h8l-4-4zM12 20l4-4H8l4 4z"/></svg>
                           )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-b border-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 truncate" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-96 text-center">
                   <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-500">No records found</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-8">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
            Showing <span className="text-slate-900 font-semibold">{table.getRowModel().rows.length}</span> of <span className="text-slate-900 font-semibold">{data.length}</span>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-100 pl-8">
            <span className="text-xs font-medium text-slate-500">Rows per page</span>
            <div className="flex gap-1">
              {[10, 15, 25, 50].map(pageSize => (
                <button
                  key={pageSize}
                  onClick={() => table.setPageSize(pageSize)}
                  className={clsx(
                    "h-7 px-2 rounded-md text-xs font-medium transition-colors border",
                    table.getState().pagination.pageSize === pageSize
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  {pageSize}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-1.5">
             {table.getPageCount() > 1 && [...Array(table.getPageCount())].map((_, i) => {
               const current = table.getState().pagination.pageIndex;
               const count = table.getPageCount();
               if (i === 0 || i === count - 1 || (i >= current - 1 && i <= current + 1)) {
                 return (
                   <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={clsx(
                      "h-8 px-3 rounded-md text-xs font-medium transition-colors",
                      current === i
                        ? "bg-sky-500 text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {i + 1}
                  </button>
                 );
               }
               if (i === 1 || i === count - 2) {
                 return <span key={i} className="self-center px-1 text-slate-300 text-xs">…</span>;
               }
               return null;
             })}
          </div>
          <div className="flex items-center gap-1 border-l border-slate-100 pl-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="font-medium text-xs h-8 px-3"
            >
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="font-medium text-xs h-8 px-3"
            >
              Next
              <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
