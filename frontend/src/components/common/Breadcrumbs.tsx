import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={clsx('flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400', className)}>
      <Link to="/" className="transition-colors hover:text-slate-900">
        Home
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-slate-300">/</span>
          {item.path ? (
            <Link to={item.path} className="transition-colors hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span className="text-sky-600">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
