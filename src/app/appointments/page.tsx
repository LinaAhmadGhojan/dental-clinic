"use client";

import { Ban, CalendarX2, ChevronLeft, ChevronRight, ListPlus, Plus, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Btn, Card, Empty, Modal, PageHeader, inputCls } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { freeSlots, isClosedDay } from "@/lib/slots";
import { useStore } from "@/lib/store";
import { todayIso } from "@/lib/utils";

const shift = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Appointments() {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const [day, setDay] = useState(todayIso());
  const [adding, setAdding] = useState(false);

  const list = s.appointments.filter((a) => a.date === day).sort((a, b) => a.time.localeCompare(b.time));
  const pName = (id: string) => s.patients.find((p) => p.id === id)?.name ?? "";
  const svc = (id: string) => s.services.find((x) => x.id === id);
  const waitlist = s.waitlist.filter((w) => w.date >= todayIso());

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("ap.title")}
        subtitle={t("ap.sub")}
        actions={<Btn icon={Plus} onClick={() => setAdding(true)}>{t("ap.new")}</Btn>}
      />

      <Card className="flex items-center justify-between gap-2">
        <Btn variant="ghost" size="sm" onClick={() => setDay(shift(day, -1))} aria-label="prev"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Btn>
        <div className="text-center">
          <div className="text-lg font-bold">{date(day)}</div>
          <button onClick={() => setDay(todayIso())} className="text-sm text-teal-700 hover:underline">{t("ap.today")}</button>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setDay(shift(day, 1))} aria-label="next"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></Btn>
      </Card>

      {isClosedDay(day) && (
        <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-medium text-slate-600">{t("ap.closed")}</div>
      )}

      <div className={`grid gap-5 ${s.doctors.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {s.doctors.map((d) => {
          const mine = list.filter((a) => a.doctorId === d.id);
          return (
            <Card key={d.id}>
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={loc(d.name)} color={d.color} size={36} />
                <div>
                  <div className="font-semibold">{loc(d.name)}</div>
                  <div className="text-sm text-slate-500">{mine.filter((a) => a.status !== "cancelled").length} {t("ap.appts")}</div>
                </div>
              </div>
              {mine.length === 0 ? <Empty icon={CalendarX2} text={t("ap.none")} /> : (
                <ul className="space-y-2">
                  {mine.map((a) => (
                    <li key={a.id} className={`rounded-2xl p-3 ring-1 ${a.status === "cancelled" || a.status === "no_show" ? "bg-slate-50 opacity-60 ring-slate-200" : "bg-white ring-slate-200"}`}
                      style={{ borderInlineStartWidth: 4, borderInlineStartColor: d.color }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium"><span className="font-mono">{a.time}</span> · {pName(a.patientId)}</div>
                          <div className="text-sm text-slate-500">{svc(a.serviceId) && loc(svc(a.serviceId)!.name)} · {svc(a.serviceId)?.minutes} {t("unit.min")}</div>
                        </div>
                        <Badge tone={a.status === "done" ? "green" : a.status === "arrived" ? "amber" : a.status === "booked" ? "teal" : "red"}>{t(`status.${a.status}`)}</Badge>
                      </div>
                      {a.status === "booked" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {a.date === todayIso() && !s.tickets.some((x) => x.apptId === a.id && x.status !== "left") && (
                            <Btn size="sm" variant="soft" onClick={() => { s.checkIn({ patientId: a.patientId, doctorId: a.doctorId, serviceId: a.serviceId, apptId: a.id }); s.toast(t("toast.checkedIn")); }}>{t("q.checkIn")}</Btn>
                          )}
                          <Btn size="sm" variant="ghost" icon={UserX} onClick={() => s.setApptStatus(a.id, "no_show")}>{t("status.no_show")}</Btn>
                          <Btn size="sm" variant="danger" icon={Ban} onClick={() => { s.cancelAppointment(a.id); s.toast(t("toast.cancelled")); }}>{t("ap.cancel")}</Btn>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="mb-1 flex items-center gap-2 font-semibold"><ListPlus className="h-4 w-4 text-teal-600" />{t("ap.waitlist")} ({waitlist.length})</h2>
        <p className="mb-3 text-sm text-slate-500">{t("ap.waitlistHint")}</p>
        {waitlist.length === 0 ? <div className="text-sm text-slate-400">{t("empty.none")}</div> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {waitlist.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                <span><b>{pName(w.patientId)}</b> · {svc(w.serviceId) && loc(svc(w.serviceId)!.name)} · {date(w.date)}</span>
                <Btn size="sm" variant="ghost" onClick={() => s.removeWaitlist(w.id)}>{t("q.remove")}</Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {adding && <NewAppointment day={day} onClose={() => setAdding(false)} />}
    </div>
  );
}

function NewAppointment({ day, onClose }: { day: string; onClose: () => void }) {
  const s = useStore();
  const { t, loc } = useI18n();
  const [patientId, setPatientId] = useState(s.patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(s.doctors[0].id);
  const [serviceId, setServiceId] = useState(s.services[0].id);
  const [d, setD] = useState(day);
  const [time, setTime] = useState("");

  const slots = useMemo(() => freeSlots(s, doctorId, d, serviceId), [s, doctorId, d, serviceId]);
  useEffect(() => { if (!slots.includes(time)) setTime(slots[0] ?? ""); }, [slots, time]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !patientId) return;
    s.bookAppointment({ patientId, doctorId, serviceId, date: d, time, source: "staff" });
    s.toast(t("toast.booked"));
    onClose();
  };

  return (
    <Modal title={t("ap.new")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {s.doctors.length > 1 && (
          <select className={inputCls} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {s.doctors.map((x) => <option key={x.id} value={x.id}>{loc(x.name)}</option>)}
          </select>
        )}
        <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {s.services.map((x) => <option key={x.id} value={x.id}>{loc(x.name)} · {x.minutes} {t("unit.min")}</option>)}
        </select>
        <input type="date" className={inputCls} min={todayIso()} value={d} onChange={(e) => setD(e.target.value)} />
        {slots.length === 0 ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("ap.noSlots")}</div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((x) => (
              <button type="button" key={x} onClick={() => setTime(x)}
                className={`rounded-xl py-2 text-sm font-medium ring-1 ${time === x ? "bg-teal-600 text-white ring-teal-600" : "ring-slate-200 hover:bg-slate-50"}`}>{x}</button>
            ))}
          </div>
        )}
        <Btn className="w-full" size="lg" disabled={!time}>{t("ap.confirm")}</Btn>
      </form>
    </Modal>
  );
}
