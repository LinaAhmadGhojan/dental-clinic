"use client";

import type { ToothCondition } from "@/lib/types";

export const CONDITIONS: { id: ToothCondition; fill: string }[] = [
  { id: "healthy", fill: "#ffffff" },
  { id: "cavity", fill: "#f87171" },
  { id: "filled", fill: "#60a5fa" },
  { id: "crown", fill: "#fbbf24" },
  { id: "rootcanal", fill: "#a78bfa" },
  { id: "missing", fill: "#d1d5db" },
];

// FDI notation, drawn the way a dentist reads the chart (patient's right on the left side).
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function toothKind(n: number) {
  const pos = n % 10;
  return pos >= 6 ? "molar" : pos >= 4 ? "premolar" : pos === 3 ? "canine" : "incisor";
}

function Tooth({ n, cond, selected, planned, upper, onClick }: {
  n: number; cond: ToothCondition; selected: boolean; planned: boolean; upper: boolean; onClick?: () => void;
}) {
  const fill = CONDITIONS.find((c) => c.id === cond)!.fill;
  const kind = toothKind(n);
  const w = kind === "molar" ? 30 : kind === "premolar" ? 25 : 20;
  const missing = cond === "missing";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`Tooth ${n}: ${cond}`}
      className={`relative flex flex-col items-center gap-1 rounded-lg p-0.5 transition ${
        selected ? "bg-teal-100 ring-2 ring-teal-500" : onClick ? "hover:bg-slate-100" : ""
      }`}
    >
      {!upper && <span className="text-[10px] text-slate-400">{n}</span>}
      <svg width={w} height="34" viewBox={`0 0 ${w} 34`}>
        <path
          d={upper ? `M2 4 Q${w / 2} -2 ${w - 2} 4 L${w - 4} 22 Q${w / 2} 36 4 22 Z` : `M4 12 Q${w / 2} -2 ${w - 4} 12 L${w - 2} 30 Q${w / 2} 38 2 30 Z`}
          fill={fill}
          stroke={missing ? "#9ca3af" : "#475569"}
          strokeWidth="1.5"
          strokeDasharray={missing ? "3 2" : undefined}
          opacity={missing ? 0.7 : 1}
        />
        {cond === "rootcanal" && <line x1={w / 2} y1="6" x2={w / 2} y2="28" stroke="#4c1d95" strokeWidth="2" />}
      </svg>
      {upper && <span className="text-[10px] text-slate-400">{n}</span>}
      {planned && <span className="absolute -top-0.5 end-0 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />}
    </button>
  );
}

export default function Odontogram({ teeth, selected, planned = [], onSelect }: {
  teeth: Record<number, ToothCondition>;
  selected?: number | null;
  /** Teeth that have a planned (not yet done) treatment get a small amber dot. */
  planned?: number[];
  onSelect?: (n: number) => void;
}) {
  const row = (list: number[], upper: boolean) => (
    <div className="flex justify-center gap-0.5">
      {list.map((n, i) => (
        <div key={n} className={i === 8 ? "ms-2 border-s border-slate-300 ps-2" : ""}>
          <Tooth n={n} upper={upper} cond={teeth[n] ?? "healthy"} selected={selected === n} planned={planned.includes(n)} onClick={onSelect ? () => onSelect(n) : undefined} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="overflow-x-auto" dir="ltr">
      <div className="mx-auto w-fit space-y-3 py-2">
        {row(UPPER, true)}
        <div className="border-t border-dashed border-slate-300" />
        {row(LOWER, false)}
      </div>
    </div>
  );
}
