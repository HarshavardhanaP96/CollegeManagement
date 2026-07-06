import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-auto"><div className="px-8 py-6 space-y-6 max-w-[1500px] mx-auto">{children}</div></div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({ label, value, delta, deltaTone = "muted" }: { label: string; value: string; delta?: string; deltaTone?: "up" | "down" | "muted" }) {
  const tone =
    deltaTone === "up" ? "text-[color:var(--success)]" :
    deltaTone === "down" ? "text-destructive" :
    "text-muted-foreground";
  return (
    <div className="p-4 bg-card ring-1 ring-black/5 rounded-lg">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {delta && <span className={`text-[10px] font-medium ${tone}`}>{delta}</span>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, padded = true }: { title?: string; action?: ReactNode; children: ReactNode; padded?: boolean }) {
  return (
    <div className="bg-card ring-1 ring-black/5 rounded-xl overflow-hidden">
      {title && (
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" }) {
  const map = {
    neutral: "bg-secondary text-foreground/70 ring-black/5",
    green:   "bg-emerald-50 text-emerald-700 ring-emerald-700/10",
    amber:   "bg-amber-50 text-amber-700 ring-amber-700/10",
    red:     "bg-red-50 text-red-700 ring-red-700/10",
    blue:    "bg-blue-50 text-blue-700 ring-blue-700/10",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${map[tone]}`}>{children}</span>;
}

export function Btn({
  variant = "secondary", children, onClick, type = "button",
}: { variant?: "primary" | "secondary" | "ghost"; children: ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  const cls =
    variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : variant === "ghost" ? "text-foreground hover:bg-secondary"
    : "bg-card ring-1 ring-black/5 text-foreground hover:bg-secondary";
  return (
    <button type={type} onClick={onClick} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${cls}`}>
      {children}
    </button>
  );
}

// Mini area chart (SVG)
export function AreaChart({ data, height = 140 }: { data: { m: string; v: number }[]; height?: number }) {
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
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={pad} x2={w - pad} y1={pad + p * (height - pad * 2)} y2={pad + p * (height - pad * 2)} stroke="var(--border-strong)" strokeDasharray="3 3" strokeWidth="0.6" />
      ))}
      <path d={area} fill="url(#areaG)" />
      <polyline fill="none" stroke="var(--accent)" strokeWidth="1.6" points={pts} />
      {data.map((d, i) => (
        <g key={d.m}>
          <circle cx={xs(i)} cy={ys(d.v)} r="2" fill="var(--accent)" />
          <text x={xs(i)} y={height - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({ data, height = 160 }: { data: { label: string; mine: number; avg: number }[]; height?: number }) {
  const max = Math.max(...data.flatMap((d) => [d.mine, d.avg]));
  const w = 600;
  const pad = 28;
  const groupW = (w - pad * 2) / data.length;
  const barW = groupW * 0.32;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto">
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <line key={p} x1={pad} x2={w - pad} y1={pad + (1 - p) * (height - pad * 2)} y2={pad + (1 - p) * (height - pad * 2)} stroke="var(--border-strong)" strokeDasharray="3 3" strokeWidth="0.6" />
      ))}
      {data.map((d, i) => {
        const cx = pad + groupW * i + groupW / 2;
        const hM = (d.mine / max) * (height - pad * 2);
        const hA = (d.avg / max) * (height - pad * 2);
        return (
          <g key={d.label}>
            <rect x={cx - barW - 1} y={height - pad - hM} width={barW} height={hM} fill="var(--accent)" rx="1.5" />
            <rect x={cx + 1} y={height - pad - hA} width={barW} height={hA} fill="var(--border-strong)" rx="1.5" />
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
