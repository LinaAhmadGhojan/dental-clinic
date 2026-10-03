"use client";

import { Clock, Star, TrendingUp, UserX } from "lucide-react";
import { BarChart, Donut } from "@/components/Charts";
import { Badge, Card, PageHeader, StatCard, Stars } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { isoDate } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { money } from "@/lib/utils";

export default function Reports() {
  const s = useStore();
  const { t, loc, lang, date } = useI18n();

  const days = Array.from({ length: 7 }, (_, i) => isoDate(i - 6));
  const label = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { weekday: "short" });
  const revenue = days.map((d) => ({ label: label(d), value: s.treatments.filter((x) => x.date === d && x.status === "done").reduce((n, x) => n + x.price, 0) }));
  const visits = days.map((d) => ({ label: label(d), value: s.appointments.filter((a) => a.date === d && (a.status === "done" || a.status === "arrived")).length }));

  const statuses = (["done", "arrived", "booked", "cancelled", "no_show"] as const).map((k) => ({
    label: t(`status.${k}`), value: s.appointments.filter((a) => a.status === k).length,
    color: { done: "#10b981", arrived: "#f59e0b", booked: "#0d9488", cancelled: "#94a3b8", no_show: "#ef4444" }[k],
  }));
  const finished = s.appointments.filter((a) => a.status === "done" || a.status === "no_show" || a.status === "cancelled");
  const noShowRate = finished.length ? Math.round((s.appointments.filter((a) => a.status === "no_show").length / finished.length) * 100) : 0;

  const waits = s.tickets.filter((x) => x.startedAt).map((x) => (x.startedAt! - x.arrivedAt) / 60000);
  const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  const rating = s.feedback.length ? s.feedback.reduce((n, f) => n + f.rating, 0) / s.feedback.length : 0;

  const byService = s.services
    .map((x) => {
      const rows = s.treatments.filter((tr) => tr.serviceId === x.id && tr.status === "done");
      return { name: loc(x.name), count: rows.length, revenue: rows.reduce((n, r) => n + r.price, 0) };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(1, ...byService.map((x) => x.revenue));

  return (
    <div className="space-y-5">
      <PageHeader title={t("r.title")} subtitle={t("r.sub")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label={t("r.revenue7")} value={money(revenue.reduce((n, x) => n + x.value, 0))} />
        <StatCard icon={Clock} label={t("r.avgWait")} value={`${avgWait} ${t("unit.min")}`} tone="violet" hint={t("r.avgWaitHint")} />
        <StatCard icon={UserX} label={t("r.noShow")} value={`${noShowRate}%`} tone="red" />
        <StatCard icon={Star} label={t("r.rating")} value={rating ? rating.toFixed(1) : "-"} tone="amber" hint={`${s.feedback.length} ${t("r.reviews")}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-semibold">{t("r.revenueChart")}</h2><BarChart data={revenue} format={(n) => `$${n}`} /></Card>
        <Card><h2 className="mb-4 font-semibold">{t("r.visitsChart")}</h2><BarChart data={visits} color="#7c3aed" /></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">{t("r.statusMix")}</h2>
          <div className="flex flex-wrap items-center gap-6">
            <Donut segments={statuses} />
            <ul className="space-y-1.5 text-sm">
              {statuses.map((x) => (
                <li key={x.label} className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ background: x.color }} />{x.label}<b className="ms-auto ps-4">{x.value}</b></li>
              ))}
            </ul>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">{t("r.topProcedures")}</h2>
          <ul className="space-y-3">
            {byService.map((x) => (
              <li key={x.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{x.name} <span className="text-slate-400">× {x.count}</span></span><b>{money(x.revenue)}</b></div>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${(x.revenue / maxRev) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">{t("r.feedback")}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {s.feedback.map((f) => (
            <li key={f.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between"><b>{s.patients.find((p) => p.id === f.patientId)?.name}</b><Stars value={f.rating} /></div>
              <p className="text-slate-600">{f.comment || <Badge>—</Badge>}</p>
              <div className="mt-1 text-sm text-slate-400">{date(f.date)}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
