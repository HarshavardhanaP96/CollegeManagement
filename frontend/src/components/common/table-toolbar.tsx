import React, { type ReactNode } from "react";
import { Search } from "lucide-react";

export function TableToolbar({
  query, onQuery, placeholder = "Search…",
  filters, action,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder?: string;
  filters?: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }[];
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-3 py-1.5 w-full bg-white ring-1 ring-slate-200 rounded-md text-xs outline-none focus:ring-slate-400 focus:ring-2 shadow-sm"
        />
      </div>
      {filters?.map((f) => (
        <select
          key={f.label}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white ring-1 ring-slate-200 rounded-md outline-none focus:ring-slate-400 focus:ring-2 shadow-sm text-slate-700 font-medium"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{f.label}: {o.label}</option>)}
        </select>
      ))}
      {action && <div className="ml-auto flex gap-2">{action}</div>}
    </div>
  );
}
