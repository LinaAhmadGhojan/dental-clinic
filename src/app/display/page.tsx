"use client";

import { Languages, Stethoscope, X } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { clinicStatus, hhmm } from "@/lib/queue";
import { useNow, useStore } from "@/lib/store";

/** Full-screen waiting-room TV: shows who is being served and who is next. */
export default function Display() {
  const s = useStore();
  const { t, loc, lang, setLang } = useI18n();
  const now = useNow(5000);
  const c = clinicStatus(s, now);
  const first = (id: string) => (s.patients.find((p) => p.id === id)?.name ?? "").split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-950 p-5 text-white sm:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500"><Stethoscope className="h-7 w-7" /></span>
          <div>
            <div className="text-2xl font-bold sm:text-3xl">{t("brand")}</div>
            <div className="text-sm text-slate-400">{t("tv.welcome")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold tabular-nums sm:text-6xl">{hhmm(now)}</div>
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="Language"><Languages className="h-5 w-5" /></button>
          <Link href="/queue" className="rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></Link>
        </div>
      </div>

      <div className={`grid gap-6 ${s.doctors.length > 1 ? "lg:grid-cols-2" : "mx-auto max-w-3xl"}`}>
        {c.per.map((p) => (
          <div key={p.doctor.id} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xl font-semibold sm:text-2xl">{loc(p.doctor.name)}</div>
              <div className="text-sm text-slate-400">~{p.newArrivalWait} {t("unit.min")}</div>
            </div>
            <div className="mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-5 ring-1 ring-emerald-400/30">
              <div className="text-sm uppercase tracking-widest text-emerald-300">{t("tv.serving")}</div>
              {p.chair ? (
                <div className="mt-1 flex items-baseline gap-4"><span className="text-6xl font-extrabold sm:text-7xl">#{p.chair.number}</span><span className="text-2xl text-slate-200">{first(p.chair.patientId)}</span></div>
              ) : <div className="mt-2 text-3xl font-bold text-emerald-300">{t("live.chairFree")}</div>}
            </div>
            <div className="text-sm uppercase tracking-widest text-slate-400">{t("tv.next")}</div>
            <ul className="mt-2 space-y-2">
              {p.rows.slice(0, 4).map((r, i) => (
                <li key={r.ticket.id} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${i === 0 ? "bg-amber-400/20 ring-1 ring-amber-300/40" : "bg-white/5"}`}>
                  <span className="flex items-center gap-4"><span className="text-3xl font-bold">#{r.ticket.number}</span><span className="text-lg text-slate-300">{first(r.ticket.patientId)}</span>{r.ticket.emergency && <span className="rounded-full bg-red-500 px-2 py-0.5 text-sm">!</span>}</span>
                  <span className="text-lg font-semibold text-slate-200">~{r.waitMin} {t("unit.min")}</span>
                </li>
              ))}
              {p.rows.length === 0 && <li className="text-slate-500">{t("q.noWaiting")}</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
