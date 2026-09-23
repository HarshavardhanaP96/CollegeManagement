import type { ReactNode } from 'react';

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-slate-900">{value ?? <span className="text-slate-300 font-medium">—</span>}</dd>
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}
