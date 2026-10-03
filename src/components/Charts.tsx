"use client";

export function BarChart({ data, color = "#0d9488", height = 160, format = (n: number) => String(n) }: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }} dir="ltr">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-medium text-slate-500 sm:text-xs">{d.value ? format(d.value) : ""}</span>
          <div
            className="w-full rounded-t-lg transition-all"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2, background: d.value ? color : "#e2e8f0" }}
          />
          <span className="text-[10px] text-slate-400 sm:text-xs">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90" role="img">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((s) => {
        const len = (s.value / total) * c;
        const el = (
          <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
