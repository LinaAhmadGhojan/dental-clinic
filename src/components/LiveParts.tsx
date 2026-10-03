"use client";

import { Armchair, Clock, Footprints, Hourglass, Navigation, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { activeTicketFor, clinicStatus, doctorQueue, hhmm, rowFor, type Level } from "@/lib/queue";
import { useNow, useStore } from "@/lib/store";
import { Badge, Btn, inputCls } from "./ui";

export const levelStyle: Record<Level, { bg: string; text: string; dot: string; key: string }> = {
  quiet: { bg: "from-emerald-500 to-teal-600", text: "text-emerald-700", dot: "bg-emerald-500", key: "live.level.quiet" },
  busy: { bg: "from-amber-400 to-orange-500", text: "text-amber-700", dot: "bg-amber-500", key: "live.level.busy" },
  crowded: { bg: "from-rose-500 to-red-600", text: "text-red-700", dot: "bg-red-500", key: "live.level.crowded" },
};

/** The big "how busy is the clinic right now" banner: the answer to "should I go now?". */
export function CrowdBanner() {
  const s = useStore();
  const { t } = useI18n();
  const now = useNow(5000);
  const c = clinicStatus(s, now);
  const st = levelStyle[c.level];
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${st.bg} p-5 text-white shadow-lg sm:p-7`}>
      <div className="absolute -end-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 end-20 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-white" />
          {t("live.now")}
        </div>
        <div className="mt-2 text-3xl font-extrabold sm:text-4xl">{t(st.key)}</div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Mini icon={Users} label={t("live.inClinic")} value={c.people} />
          <Mini icon={Hourglass} label={t("live.waiting")} value={c.waiting} />
          <Mini icon={Clock} label={t("live.waitNew")} value={`${c.wait} ${t("unit.min")}`} />
        </div>
        <p className="mt-4 text-sm text-white/90">
          {c.level === "quiet" ? t("live.advice.quiet") : c.level === "busy" ? t("live.advice.busy") : t("live.advice.crowded")}
        </p>
      </div>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <Icon className="mb-1 h-4 w-4 opacity-80" />
      <div className="text-xl font-bold sm:text-2xl">{value}</div>
      <div className="text-xs leading-tight text-white/80 sm:text-sm">{label}</div>
    </div>
  );
}

export function DoctorStatusCards() {
  const s = useStore();
  const { t, loc } = useI18n();
  const now = useNow(5000);
  return (
    <div className={`grid gap-3 ${s.doctors.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {s.doctors.map((d) => {
        const q = doctorQueue(s, d.id, now);
        const late = s.delays[d.id] ?? 0;
        return (
          <div key={d.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{loc(d.name)}</div>
                <div className="text-sm text-slate-500">{loc(d.specialty)}</div>
              </div>
              <Badge tone={q.chair ? "amber" : "green"}>
                <Armchair className="h-3 w-3" />
                {q.chair ? t("live.chairBusy") : t("live.chairFree")}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-lg font-bold">{q.rows.length}</div>
                <div className="text-xs text-slate-500">{t("live.waiting")}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-lg font-bold">{q.newArrivalWait} <span className="text-sm font-normal">{t("unit.min")}</span></div>
                <div className="text-xs text-slate-500">{t("live.waitNew")}</div>
              </div>
            </div>
            {late > 0 && <div className="mt-2 text-sm font-medium text-amber-700">⏱ {t("live.late", { n: late })}</div>}
          </div>
        );
      })}
    </div>
  );
}

const TRAVEL_KEY = "dentacare:travel";

/** Track my turn: shows position, estimated wait and when to leave home. Also lets the patient join the virtual queue. */
export function TrackerCard({ patientId }: { patientId: string }) {
  const s = useStore();
  const { t, loc } = useI18n();
  const now = useNow(5000);
  const [travel, setTravel] = useState(20);
  const ticket = activeTicketFor(s, patientId);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(TRAVEL_KEY));
      if (v > 0) setTravel(v);
    } catch {}
  }, []);

  const setTravelSaved = (v: number) => {
    setTravel(v);
    try {
      localStorage.setItem(TRAVEL_KEY, String(v));
    } catch {}
  };

  const today = new Date().toISOString().slice(0, 10);
  const appt = s.appointments.find((a) => a.patientId === patientId && a.status === "booked" && a.date === today);
  const [doctorId, setDoctorId] = useState(appt?.doctorId ?? s.doctors[0].id);
  const [serviceId, setServiceId] = useState(appt?.serviceId ?? s.services[0].id);

  if (ticket) {
    const row = rowFor(s, ticket, now);
    const inChair = ticket.status === "in_chair";
    const wait = row?.waitMin ?? 0;
    const ahead = row?.ahead ?? 0;
    const leaveIn = wait - travel;
    const doctor = s.doctors.find((d) => d.id === ticket.doctorId)!;
    return (
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <div className="bg-gradient-to-br from-teal-600 to-cyan-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">{t("track.yourTicket")}</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">#{ticket.number}</span>
          </div>
          {inChair ? (
            <div className="mt-3 text-2xl font-extrabold sm:text-3xl">{t("track.inChair")}</div>
          ) : (
            <div className="mt-3 flex items-end gap-6">
              <div>
                <div className="text-5xl font-extrabold leading-none">{ahead}</div>
                <div className="mt-1 text-sm text-white/80">{t("track.ahead")}</div>
              </div>
              <div>
                <div className="text-5xl font-extrabold leading-none">{wait}</div>
                <div className="mt-1 text-sm text-white/80">{t("track.minWait")}</div>
              </div>
            </div>
          )}
          <div className="mt-4 text-sm text-white/85">
            {loc(doctor.name)} · {loc(s.services.find((x) => x.id === ticket.serviceId)!.name)}
            {!inChair && <> · {t("track.expected")} <b>{hhmm(now + wait * 60000)}</b></>}
          </div>
          {!inChair && (
            <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
              {Array.from({ length: Math.min(ahead, 12) }).map((_, i) => (
                <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25"><Users className="h-3.5 w-3.5" /></span>
              ))}
              <span className="flex h-7 items-center rounded-full bg-white px-3 text-sm font-bold text-teal-700">{t("track.you")}</span>
            </div>
          )}
        </div>

        {ticket.onTheWay && !inChair && (
          <div className="space-y-3 border-b border-slate-100 p-4">
            <div className={`flex items-start gap-3 rounded-2xl p-3 ${leaveIn <= 0 ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
              <Navigation className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                <b>{leaveIn <= 0 ? t("track.leaveNow") : t("track.leaveIn", { n: leaveIn, time: hhmm(now + leaveIn * 60000) })}</b>
                <div className="text-sm opacity-80">{t("track.leaveHint")}</div>
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <Footprints className="h-4 w-4" />
              {t("track.travel")}
              <input type="range" min={5} max={60} step={5} value={travel} onChange={(e) => setTravelSaved(Number(e.target.value))} className="flex-1 accent-teal-600" />
              <b className="w-16 text-end">{travel} {t("unit.min")}</b>
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2 p-4">
          {ticket.onTheWay && (
            <Btn icon={UserCheck} onClick={() => { s.markArrived(ticket.id); s.toast(t("toast.arrived")); }}>{t("track.imHere")}</Btn>
          )}
          {!inChair && (
            <Btn variant="danger" onClick={() => { s.leaveTicket(ticket.id); s.toast(t("toast.spotReleased")); }}>{t("track.cancelSpot")}</Btn>
          )}
          <p className="w-full text-sm text-slate-400">{t("track.notify")}</p>
        </div>
      </div>
    );
  }

  const q = doctorQueue(s, doctorId, now);
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <h3 className="text-lg font-bold">{t("track.joinTitle")}</h3>
      <p className="mt-1 text-sm text-slate-500">{t("track.joinText")}</p>
      <div className={`mt-4 grid gap-3 ${s.doctors.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {s.doctors.length > 1 && (
          <select className={inputCls} value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label={t("f.doctor")}>
            {s.doctors.map((d) => <option key={d.id} value={d.id}>{loc(d.name)}</option>)}
          </select>
        )}
        <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)} aria-label={t("f.service")}>
          {s.services.map((x) => <option key={x.id} value={x.id}>{loc(x.name)}</option>)}
        </select>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
        <div className="text-sm text-slate-600">
          {t("track.ifYouJoin")}: <b>{q.rows.length + (q.chair ? 1 : 0)}</b> {t("track.peopleAhead")} · ~<b>{q.newArrivalWait}</b> {t("unit.min")}
        </div>
        <Btn
          onClick={() => {
            s.checkIn({ patientId, doctorId, serviceId, apptId: appt && appt.doctorId === doctorId && appt.serviceId === serviceId ? appt.id : undefined, onTheWay: true });
            s.toast(t("toast.joined"));
          }}
        >
          {t("track.join")}
        </Btn>
      </div>
    </div>
  );
}
