"use client";

import { CalendarPlus, FolderHeart, MapPin, Phone, Radio, X } from "lucide-react";
import Link from "next/link";
import HowItWorks from "@/components/HowItWorks";
import { CrowdBanner, TrackerCard } from "@/components/LiveParts";
import { Badge, Btn, Card, Empty } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { activeTicketFor } from "@/lib/queue";
import { useStore } from "@/lib/store";
import { balanceOf, money, todayIso } from "@/lib/utils";

export default function PatientHome() {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const me = s.patients.find((p) => p.id === s.meId)!;
  const upcoming = s.appointments
    .filter((a) => a.patientId === me.id && a.status === "booked" && a.date >= todayIso())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const hasTicket = !!activeTicketFor(s, me.id);
  const balance = balanceOf(s, me.id);
  const myWaitlist = s.waitlist.filter((w) => w.patientId === me.id);
  const latest = s.messages.find((m) => m.patientId === me.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("ph.hello", { name: me.name.split(" ")[0] })} 👋</h1>
        <p className="text-sm text-slate-500">{t("ph.sub")}</p>
      </div>

      <HowItWorks role="patient" />

      {hasTicket || upcoming.some((a) => a.date === todayIso()) ? <TrackerCard patientId={me.id} /> : <CrowdBanner />}

      <div className="grid gap-3">
        {[
          { href: "/p/book", icon: CalendarPlus, label: t("ph.act.book"), sub: t("ph.act.bookSub"), tone: "from-teal-500 to-cyan-600" },
          { href: "/live", icon: Radio, label: t("ph.act.live"), sub: t("ph.act.liveSub"), tone: "from-emerald-500 to-teal-600" },
          { href: "/p/records", icon: FolderHeart, label: t("ph.act.records"), sub: t("ph.act.recordsSub"), tone: "from-violet-500 to-indigo-600" },
        ].map((x) => (
          <Link key={x.href} href={x.href} className={`flex items-center gap-4 rounded-3xl bg-gradient-to-br ${x.tone} p-5 text-white shadow-lg shadow-slate-900/10 transition active:scale-[.99]`}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"><x.icon className="h-8 w-8" /></span>
            <span>
              <span className="block text-xl font-bold leading-tight">{x.label}</span>
              <span className="mt-0.5 block text-sm text-white/85">{x.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">{t("ph.upcoming")}</h2>
        {upcoming.length === 0 ? (
          <Empty icon={CalendarPlus} text={t("ph.noUpcoming")} />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => {
              const d = s.doctors.find((x) => x.id === a.doctorId)!;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white text-center ring-1 ring-slate-200">
                    <span className="text-xs uppercase text-slate-400">{date(a.date).split(" ")[0]}</span>
                    <span className="font-mono text-sm font-bold">{a.time}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-semibold">{loc(s.services.find((x) => x.id === a.serviceId)!.name)}</div>
                    <div className="text-sm text-slate-500">{loc(d.name)} · {date(a.date)}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-sm text-slate-400"><MapPin className="h-3 w-3" />{t("ph.address")}</div>
                  </div>
                  <Btn size="sm" variant="danger" icon={X} onClick={() => { s.cancelAppointment(a.id); s.toast(t("toast.cancelled")); }}>{t("ap.cancel")}</Btn>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {balance > 0 && (
        <Link href="/p/records" className="flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          <span>{t("ph.balanceDue")}</span><b className="text-lg">{money(balance)}</b>
        </Link>
      )}

      {myWaitlist.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">{t("ph.waitlist")}</h2>
          <ul className="space-y-2 text-sm">
            {myWaitlist.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-2.5">
                <span>{loc(s.services.find((x) => x.id === w.serviceId)!.name)} · {date(w.date)}</span>
                <Badge tone="amber">{t("ph.waiting")}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {latest && (
        <Link href="/p/inbox" className="block rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-1 text-sm font-medium text-teal-700">{t("ph.latest")}</div>
          {loc(latest.text)}
        </Link>
      )}

      <a href="tel:+962000000" className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 p-3 text-sm font-medium text-white"><Phone className="h-4 w-4" />{t("ph.call")}</a>
    </div>
  );
}
