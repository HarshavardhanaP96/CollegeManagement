import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getRoleStrategy } from '../strategies/roleStrategy';
import type { DashboardCard } from '../strategies/roleStrategy';
import { NavIcon } from '../components/layout/navIconMap';

function StatCard({ card }: { card: DashboardCard }) {
  const { data, isLoading, error } = useQuery({
    queryKey: card.queryKey || [card.key],
    queryFn: card.fetchFn || (async () => ({ label: card.title, value: '—' })),
    enabled: !!card.fetchFn,
  });

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-colors duration-150 hover:border-sky-200">
      <h3 className="text-[13px] font-medium text-slate-500">
        {card.title}
      </h3>
      <div className="mt-4 flex items-baseline gap-2">
        {isLoading ? (
          <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
        ) : error ? (
          <span className="text-sm font-semibold text-red-500">Error sync</span>
        ) : (
          <>
            <span className="font-display text-4xl font-semibold text-slate-900 leading-none">
              {data?.value}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {data?.label}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({ card }: { card: DashboardCard }) {
  if (!card.actions) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-5 text-[13px] font-medium text-slate-500">{card.title}</h3>
      <div className="grid gap-2">
        {card.actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-sky-200 hover:bg-white hover:text-sky-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-100 transition-colors group-hover:bg-sky-50 group-hover:text-sky-600">
              <NavIcon name={action.icon} size={18} />
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
    <div className="mx-auto max-w-7xl">
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-slate-900 p-8 text-white md:p-10">
        <div className="relative">
          <p className="text-sm font-medium text-sky-400">{strategy.displayName} · {user.collegeName || 'your institution'}</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-[40px] text-white">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-slate-400 leading-relaxed">
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
