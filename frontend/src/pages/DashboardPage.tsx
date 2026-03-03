import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getRoleStrategy } from '../strategies/roleStrategy';
import type { DashboardCard } from '../strategies/roleStrategy';

function StatCard({ card }: { card: DashboardCard }) {
  const { data, isLoading, error } = useQuery({
    queryKey: card.queryKey || [card.key],
    queryFn: card.fetchFn || (async () => ({ label: card.title, value: '—' })),
    enabled: !!card.fetchFn,
  });

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-200 hover:shadow-md">
      {/* Decorative background element */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-slate-50 transition-colors group-hover:bg-sky-50" />
      
      <div className="relative">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {card.title}
        </h3>
        <div className="mt-5 flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : error ? (
            <span className="text-sm font-bold text-red-500">Error sync</span>
          ) : (
            <>
              <span className="text-4xl font-black text-slate-900 leading-none">
                {data?.value}
              </span>
              <span className="text-xs font-bold uppercase tracking-tight text-slate-400">
                {data?.label}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ card }: { card: DashboardCard }) {
  if (!card.actions) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-400">{card.title}</h3>
      <div className="grid gap-3">
        {card.actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-sky-300 hover:bg-white hover:text-sky-700 hover:shadow-lg hover:shadow-sky-500/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm transition-colors group-hover:bg-sky-50">
              {action.icon}
            </div>
            {action.label}
            <svg className="ml-auto h-5 w-5 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardCardRenderer({ card }: { card: DashboardCard }) {
  switch (card.type) {
    case 'quick-action':
      return <QuickActionCard card={card} />;
    case 'stat':
      return <StatCard card={card} />;
    default:
      return null;
  }
}

export function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const strategy = getRoleStrategy(user.roleName);
  const cards = strategy.dashboardCards;

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200/50 md:p-10">
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/20 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-400 border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            Live Session
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight md:text-5xl text-white">
            Welcome back, <span className="text-sky-400">{user.fullName.split(' ')[0]}</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-400 font-medium leading-relaxed">
            {strategy.displayName} portal at <span className="text-slate-200 font-bold">{user.collegeName || 'your institution'}</span>. 
            Everything is set up and ready for your next tasks.
          </p>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <DashboardCardRenderer key={card.key} card={card} />
        ))}
      </div>
    </div>
  );
}
