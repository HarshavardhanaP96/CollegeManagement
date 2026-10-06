import React, { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-auto"><div className="px-8 py-6 space-y-6 max-w-[1500px] mx-auto">{children}</div></div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({ label, value, delta, deltaTone = "muted" }: { label: string; value: string; delta?: string; deltaTone?: "up" | "down" | "muted" }) {
  const tone =
    deltaTone === "up" ? "text-emerald-600" :
    deltaTone === "down" ? "text-red-600" :
    "text-slate-500";
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold tracking-tight tabular-nums text-slate-900">{value}</span>
        {delta && <span className={`text-xs font-medium ${tone}`}>{delta}</span>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, padded = true }: { title?: string; action?: ReactNode; children: ReactNode; padded?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {title && (
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" }) {
  const map = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    green:   "bg-emerald-50 text-emerald-700 ring-emerald-700/10",
    amber:   "bg-amber-50 text-amber-700 ring-amber-700/10",
    red:     "bg-red-50 text-red-700 ring-red-700/10",
    blue:    "bg-blue-50 text-blue-700 ring-blue-700/10",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${map[tone]}`}>{children}</span>;
}

export function Btn({
  variant = "secondary", children, onClick, type = "button", className = "",
}: { variant?: "primary" | "secondary" | "ghost"; children: ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string }) {
  const cls =
    variant === "primary" ? "bg-[#9c6b1a] text-white hover:bg-[#7c5414]"
    : variant === "ghost" ? "text-slate-700 hover:bg-slate-100"
    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";
  return (
    <button type={type} onClick={onClick} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 inline-flex items-center justify-center gap-1.5 ${cls} ${className}`}>
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl ring-1 ring-slate-200 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="size-7 grid place-items-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="size-4" /></button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">{footer}</div>}
      </div>
    </div>
  );
}

// Mini area chart (SVG)
export function AreaChart({ data, height = 140 }: { data: { m: string; v: number }[]; height?: number }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.v));
  const min = Math.min(...data.map((d) => d.v));
  const w = 600;
  const pad = 24;
  const xs = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const ys = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
  const pts = data.map((d, i) => `${xs(i)},${ys(d.v)}`).join(" ");
  const area = `M ${xs(0)},${height - pad} L ${pts} L ${xs(data.length - 1)},${height - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={pad} x2={w - pad} y1={pad + p * (height - pad * 2)} y2={pad + p * (height - pad * 2)} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.6" />
      ))}
      <path d={area} fill="url(#areaG)" />
      <polyline fill="none" stroke="#0f172a" strokeWidth="2" points={pts} />
      {data.map((d, i) => (
        <g key={d.m}>
          <circle cx={xs(i)} cy={ys(d.v)} r="3" fill="#0f172a" />
          <text x={xs(i)} y={height - 6} textAnchor="middle" fontSize="9" fill="#64748b">{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({ data, height = 160 }: { data: { label: string; mine: number; avg: number }[]; height?: number }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.flatMap((d) => [d.mine, d.avg]));
  const w = 600;
  const pad = 28;
  const groupW = (w - pad * 2) / data.length;
  const barW = groupW * 0.32;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto">
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <line key={p} x1={pad} x2={w - pad} y1={pad + (1 - p) * (height - pad * 2)} y2={pad + (1 - p) * (height - pad * 2)} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.6" />
      ))}
      {data.map((d, i) => {
        const cx = pad + groupW * i + groupW / 2;
        const hM = (d.mine / (max || 1)) * (height - pad * 2);
        const hA = (d.avg / (max || 1)) * (height - pad * 2);
        return (
          <g key={d.label}>
            <rect x={cx - barW - 1} y={height - pad - hM} width={barW} height={hM} fill="#0f172a" rx="1.5" />
            <rect x={cx + 1} y={height - pad - hA} width={barW} height={hA} fill="#94a3b8" rx="1.5" />
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="9" fill="#64748b">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
