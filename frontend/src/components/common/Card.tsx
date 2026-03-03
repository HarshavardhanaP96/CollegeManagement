import { type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  noPadding?: boolean;
}

export function Card({ className, children, title, description, headerActions, noPadding, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md',
        className
      )}
      {...props}
    >
      {(title || description || headerActions) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/30">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
            {description && <p className="mt-1 text-sm text-slate-500 font-medium">{description}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
