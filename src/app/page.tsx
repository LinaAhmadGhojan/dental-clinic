"use client";

import { Activity, CalendarCheck, CalendarPlus, ChevronDown, Clock, DollarSign, Megaphone, PlayCircle, Radio, UserCheck, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import HowItWorks from "@/components/HowItWorks";
import { Avatar, Badge, Btn, Card, Empty, StatCard } from "@/components/ui";
import { BarChart } from "@/components/Charts";
import { levelStyle } from "@/components/LiveParts";
import { useI18n } from "@/lib/i18n";
import { clinicStatus } from "@/lib/queue";
import { isoDate } from "@/lib/seed";
import { useNow, useStore } from "@/lib/store";
import { money, recallDue, todayIso } from "@/lib/utils";

export default function Dashboard() {
  const s = useStore();
  const { t, loc, lang } = useI18n();
  const now = useNow(10000);
  const today = todayIso();
  const c = clinicStatus(s, now);

  const todays = s.appointments.filter((a) => a.date === today && a.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const pName = (id: string) => s.patients.find((p) => p.id === id)?.name ?? "";
  const svc = (id: string) => s.services.find((x) => x.id === id);
  const collected = s.treatments.reduce((n, x) => n + x.paid, 0);
  const outstanding = s.treatments.filter((x) => x.status === "done").reduce((n, x) => n + x.price - x.paid, 0);
  const recall = recallDue(s);
  const staffMsgs = s.messages.filter((m) => m.patientId === null).slice(0, 5);
  const st = levelStyle[c.level];

  const week = Array.from({ length: 7 }, (_, i) => {
    const iso = isoDate(i - 6);
    const label = new Date(iso + "T12:00:00").toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { weekday: "short" });
    return { label, value: s.treatments.filter((x) => x.date === iso && x.status === "done").reduce((n, x) => n + x.price, 0) };
  });

  // The 4 things reception does all day, as big obvious buttons.
  const actions = [
    { href: "/queue", icon: UserCheck, title: t("dash.a1"), sub: t("dash.a1s"), tone: "from-teal-500 to-cyan-600" },
    { href: "/queue", icon: PlayCircle, title: t("dash.a2"), sub: t("dash.a2s"), tone: "from-emerald-500 to-teal-600" },
    { href: "/appointments", icon: CalendarPlus, title: t("dash.a3"), sub: t("dash.a3s"), tone: "from-sky-500 to-indigo-600" },
    { href: "/patients", icon: UserPlus, title: t("dash.a4"), sub: t("dash.a4s"), tone: "from-violet-500 to-fuchsia-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dash.title")}</h1>
        <p className="mt-1 text-base text-slate-500">{t("dash.sub")}</p>
      </div>

      <HowItWorks role="staff" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.title} href={a.href}
            className={`group flex items-center gap-4 rounded-3xl bg-gradient-to-br ${a.tone} p-5 text-white shadow-lg shadow-slate-900/10 transition hover:scale-[1.02]`}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"><a.icon className="h-8 w-8" /></span>
            <span>
              <span className="block text-xl font-bold leading-tight">{a.title}</span>
              <span className="mt-0.5 block text-sm text-white/85">{a.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label={t("dash.todayAppts")} value={todays.length} hint={`${todays.filter((a) => a.status === "done").length} ${t("status.done")}`} />
        <StatCard icon={Users} label={t("dash.waitingNow")} value={c.waiting} tone="amber" hint={`${c.inChair} ${t("dash.inChair")}`} />
        <StatCard icon={Clock} label={t("dash.avgWait")} value={`${c.wait} ${t("unit.min")}`} tone="violet" hint={t("dash.forNew")} />
        <StatCard icon={DollarSign} label={t("dash.outstanding")} value={money(outstanding)} tone="red" hint={`${t("dash.collected")}: ${money(collected)}`} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">{t("dash.schedule")}</h2>
        {todays.length === 0 ? <Empty icon={CalendarCheck} text={t("dash.noAppts")} /> : (
          <ul className="divide-y divide-slate-100">
            {todays.map((a) => {
              const d = s.doctors.find((x) => x.id === a.doctorId)!;
              const hasTicket = s.tickets.some((x) => x.apptId === a.id && x.status !== "left");
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-16 font-mono text-lg font-semibold tabular-nums text-slate-700">{a.time}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-medium">{pName(a.patientId)}</div>
                    <div className="truncate text-sm text-slate-500">{svc(a.serviceId) && loc(svc(a.serviceId)!.name)} · {loc(d.name)}</div>
                  </div>
                  <Badge tone={a.status === "done" ? "green" : a.status === "arrived" ? "amber" : a.status === "no_show" ? "red" : "teal"}>{t(`status.${a.status}`)}</Badge>
                  {a.status === "booked" && !hasTicket && (
                    <Btn size="md" variant="soft" onClick={() => { s.checkIn({ patientId: a.patientId, doctorId: a.doctorId, serviceId: a.serviceId, apptId: a.id }); s.toast(t("toast.checkedIn")); }}>{t("q.checkIn")}</Btn>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Less-used information is folded away so the main screen stays calm. */}
      <details className="group rounded-3xl bg-white/70 ring-1 ring-slate-200/70">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-lg font-semibold">
          {t("dash.more")}
          <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
        </summary>
        <div className="grid gap-5 p-5 pt-0 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Activity className="h-4 w-4 text-teal-600" />{t("dash.liveQueue")}
              <span className={`ms-1 inline-flex items-center gap-1.5 text-sm font-medium ${st.text}`}>
                <span className={`live-dot h-2 w-2 rounded-full ${st.dot}`} />{t(st.key)}
              </span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.per.map((p) => (
                <div key={p.doctor.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar name={loc(p.doctor.name)} color={p.doctor.color} size={32} />
                    <div className="text-base font-semibold">{loc(p.doctor.name)}</div>
                  </div>
                  <div className={`mb-2 rounded-xl px-3 py-2 text-sm ${p.chair ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
                    {p.chair ? <><b>{t("q.inChair")}:</b> #{p.chair.number} {pName(p.chair.patientId)}</> : t("live.chairFree")}
                  </div>
                  <div className="text-sm text-slate-600">{p.rows.length} {t("live.waiting")}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">{t("dash.weekRevenue")}</h3>
            <BarChart data={week} format={(n) => `$${n}`} />
            <Link href="/reports" className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline">{t("dash.allReports")} →</Link>
          </Card>
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Megaphone className="h-4 w-4 text-teal-600" />{t("dash.activity")}</h3>
            {staffMsgs.length === 0 && <div className="text-sm text-slate-400">{t("empty.none")}</div>}
            <ul className="space-y-2 text-sm">
              {staffMsgs.map((m) => <li key={m.id} className="rounded-xl bg-slate-50 p-2.5 text-slate-600">{loc(m.text)}</li>)}
            </ul>
          </Card>
          <Card>
            <h3 className="mb-1 font-semibold">{t("dash.recall")}</h3>
            <p className="mb-3 text-sm text-slate-500">{t("dash.recallHint")}</p>
            {recall.length === 0 ? <div className="text-sm text-slate-400">{t("dash.recallNone")}</div> : (
              <ul className="space-y-2">
                {recall.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name}</span>
                    <Btn size="sm" variant="soft" onClick={() => s.toast(t("toast.recallSent", { name: p.name }))}>{t("dash.sendReminder")}</Btn>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Link href="/live" className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-4 text-white shadow-md">
            <div>
              <div className="font-semibold">{t("dash.publicLive")}</div>
              <div className="text-sm text-white/80">{t("dash.publicLiveHint")}</div>
            </div>
            <Radio className="h-6 w-6" />
          </Link>
        </div>
      </details>
    </div>
  );
}
