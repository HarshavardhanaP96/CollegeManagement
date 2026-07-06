import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface FormPageLayoutProps {
  children: ReactNode;
  className?: string;
}

/** Scrollable area for long forms inside the main shell (flex + min-h-0 chain). */
export function FormPageLayout({ children, className }: FormPageLayoutProps) {
  return (
    <div
      className={clsx(
        'flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain pb-10',
        className
      )}
    >
      {children}
    </div>
  );
}
