import { useAuthStore } from '../../store/authStore';
import { getRoleStrategy } from '../../strategies/roleStrategy';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Breadcrumbs } from '../common/Breadcrumbs';

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
}

export function Header({ onToggleSidebar, isCollapsed }: HeaderProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const strategy = getRoleStrategy(user.roleName);
  
  // Extract path segments for dynamic breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment: string, index: number) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    path: '/' + pathSegments.slice(0, index + 1).join('/')
  }));

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 md:px-8 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={clsx(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-sky-200 hover:text-sky-600 active:scale-95",
            !isCollapsed && "md:hidden" // Hide in header if sidebar is open and showing the toggle
          )}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className={clsx("h-6 w-[1px] bg-slate-200 hidden md:block", isCollapsed && "md:hidden")} />
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications or other icons could go here */}
        <button className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
        </button>

        <div className="h-8 w-[1px] bg-slate-100" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <div className="text-sm font-bold text-slate-900 leading-none">{user.fullName}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-tight text-sky-600">{strategy.displayName}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white shadow-xl shadow-slate-200">
            {user.fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
