import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getRoleStrategy } from '../../strategies/roleStrategy';
import type { NavItem } from '../../strategies/roleStrategy';
import { NavIcon } from './navIconMap';
import { getAppInfo } from '../../api/version';
import { queryKeys } from '../../api/queryKeys';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const strategy = getRoleStrategy(user.roleName);
  const navItems = strategy.navItems;

  // Best-effort — if /actuator/info is unreachable this just stays blank, never blocks the UI.
  const { data: appInfo } = useQuery({
    queryKey: queryKeys.appInfo.all,
    queryFn: () => getAppInfo(),
    staleTime: Infinity,
    retry: false,
  });
  const appVersion = appInfo?.build?.version;

  const groups = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-400 shrink-0 transition-all duration-300 border-r border-white/5",
          isCollapsed ? "w-20" : "w-64",
          "md:relative md:z-10 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
      {/* Brand Section */}
      <div 
        className={clsx(
          "flex h-16 items-center flex-shrink-0 border-b border-white/5 transition-colors duration-200", 
          isCollapsed ? "justify-center cursor-pointer hover:bg-white/5" : "justify-between px-6"
        )}
        onClick={isCollapsed ? onToggle : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white">
            <GraduationCap size={20} strokeWidth={2.25} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold text-white leading-tight">
                Portal+
              </span>
              <span className="text-[11px] font-medium text-sky-400">
                Academic Suite
              </span>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 opacity-60 hover:opacity-100 hover:text-white transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-6 space-y-6 scrollbar-hide">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName}>
            {!isCollapsed && (
              <p className="mb-3 px-4 text-[11px] font-semibold text-slate-500/80 truncate">
                {groupName}
              </p>
            )}
            {isCollapsed && <div className="h-px bg-slate-800/50 mx-4 mb-4" />}
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={clsx(
                      "flex items-center gap-3 rounded-md border-l-2 transition-colors duration-150",
                      isCollapsed ? "justify-center px-0 py-3 mx-2 border-l-0" : "pl-[14px] pr-4 py-2.5 text-[13px] font-medium mx-2",
                      isActive
                        ? "bg-sky-500/10 border-sky-500 text-sky-400"
                        : "border-transparent hover:bg-slate-800/50 hover:text-white"
                    )}
                  >
                    <span className="shrink-0">
                      <NavIcon name={item.icon} size={18} />
                    </span>
                    {!isCollapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className={clsx("border-t border-slate-800", isCollapsed ? "p-4" : "p-5")}>
        <div className={clsx("flex items-center mb-4", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-white text-sm">
            {user.fullName[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
               <div className="text-sm font-semibold text-white truncate leading-none mb-1">{user.fullName}</div>
               <div className="text-xs font-medium text-sky-400 truncate">{strategy.displayName}</div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          title={isCollapsed ? "Log out" : undefined}
          className={clsx(
            "group flex items-center justify-center gap-2.5 rounded-md border border-slate-800 text-slate-400 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20",
            isCollapsed ? "w-full p-3" : "w-full px-4 py-2.5 text-[13px] font-medium"
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          {!isCollapsed && "Log out"}
        </button>

        {!isCollapsed && appVersion && (
          <p className="mt-3 text-center text-[11px] text-slate-600">
            v{appVersion}{appInfo?.apiVersion ? ` · ${appInfo.apiVersion}` : ''}
          </p>
        )}
      </div>
    </aside>
  </>
  );
}
