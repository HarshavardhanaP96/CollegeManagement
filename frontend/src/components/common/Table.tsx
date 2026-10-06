import { type ReactNode, type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes, type TableHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={clsx('w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={clsx(
        'bg-slate-50 border-b border-slate-200 sticky top-0 z-10',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={clsx('divide-y divide-slate-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={clsx(
        'group transition-colors duration-150',
        props.onClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={clsx('px-6 py-3.5 text-left text-xs font-semibold text-slate-500', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('px-6 py-3.5 text-slate-700', className)} {...props}>
      {children}
    </td>
  );
}
