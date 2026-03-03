import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-4 flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <span className="text-slate-400">/</span>}
          {item.path && index < items.length - 1 ? (
            <Link to={item.path} className="text-slate-600 hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'font-medium text-slate-900' : 'text-slate-600'}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
