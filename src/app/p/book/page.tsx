"use client";

import { BellRing, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, Btn, Card, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { freeSlots, isClosedDay } from "@/lib/slots";
import { useStore } from "@/lib/store";
import { nextDays } from "@/lib/utils";

export default function Book() {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState("");
  const [doctorId, setDoctorId] = useState("any");
  const [day, setDay] = useState(nextDays(1)[0]);
  const [time, setTime] = useState("");
  const [done, setDone] = useState<{ doctorId: string } | null>(null);

  const days = nextDays(14);
  // "Any doctor" merges both doctors' free slots and assigns whoever is free.
  const slotMap = useMemo(() => {
    if (!serviceId) return new Map<string, string>();
    const m = new Map<string, string>();
    for (const d of s.doctors) {
      if (doctorId !== "any" && d.id !== doctorId) continue;
      for (const slot of freeSlots(s, d.id, day, serviceId)) if (!m.has(slot)) m.set(slot, d.id);
    }
    return new Map([...m.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [s, serviceId, doctorId, day]);

  const service = s.services.find((x) => x.id === serviceId);
  const alreadyWaiting = s.waitlist.some((w) => w.patientId === s.meId && w.date === day && w.serviceId === serviceId);

  const confirm = () => {
    const did = slotMap.get(time);
    if (!did) return;
    s.bookAppointment({ patientId: s.meId, doctorId: did, serviceId, date: day, time, source: "patient" });
    s.toast(t("toast.booked"));
    setDone({ doctorId: did });
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-10 w-10" /></div>
        <h1 className="text-2xl font-bold">{t("bk.doneTitle")}</h1>
        <Card className="text-start text-sm">
          <div className="font-semibold">{service && loc(service.name)}</div>
          <div className="text-slate-500">{loc(s.doctors.find((d) => d.id === done.doctorId)!.name)}</div>
          <div className="mt-1 font-mono text-lg font-bold">{date(day)} · {time}</div>
        </Card>
        <p className="text-sm text-slate-500">{t("bk.doneHint")}</p>
        <div className="flex gap-2">
          <Link href="/p" className="flex-1"><Btn className="w-full">{t("nav.home")}</Btn></Link>
          <Btn variant="ghost" className="flex-1" onClick={() => { setDone(null); setStep(1); setServiceId(""); setTime(""); }}>{t("bk.another")}</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("nav.book")} subtitle={t("bk.sub")} />
      <div className="flex items-center gap-2" aria-label="progress">
        {[1, 2, 3].map((n) => <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-teal-500" : "bg-slate-200"}`} />)}
      </div>

      {step > 1 && <button onClick={() => setStep(step === 3 && s.doctors.length === 1 ? 1 : step - 1)} className="flex items-center gap-1 text-sm text-teal-700"><ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t("bk.back")}</button>}

      {step === 1 && (
        <div>
          <h2 className="mb-3 font-semibold">{t("bk.step1")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.services.filter((x) => x.id !== "s9").map((x) => (
              <button key={x.id} onClick={() => { setServiceId(x.id); setStep(s.doctors.length > 1 ? 2 : 3); }}
                className="flex items-center justify-between rounded-2xl bg-white p-4 text-start shadow-sm ring-1 ring-slate-200/70 transition hover:ring-teal-400">
                <div><div className="font-medium">{loc(x.name)}</div><div className="text-sm text-slate-500">{x.minutes} {t("unit.min")}</div></div>
                <div className="text-lg font-bold text-teal-700">${x.price}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-3 font-semibold">{t("bk.step2")}</h2>
          <div className="grid gap-3">
            {[{ id: "any", name: { en: "Any available doctor", ar: "أي طبيب متاح" }, specialty: { en: "Earliest appointment", ar: "أقرب موعد" }, color: "#64748b" }, ...s.doctors].map((d) => (
              <button key={d.id} onClick={() => { setDoctorId(d.id); setStep(3); }}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-start shadow-sm ring-1 ring-slate-200/70 hover:ring-teal-400">
                <Avatar name={loc(d.name)} color={d.color} size={44} />
                <div><div className="font-medium">{loc(d.name)}</div><div className="text-sm text-slate-500">{loc(d.specialty)}</div></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold">{t("bk.step3")}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              const closed = isClosedDay(d);
              const parts = date(d).split(" ");
              return (
                <button key={d} disabled={closed} onClick={() => { setDay(d); setTime(""); }}
                  className={`flex w-16 shrink-0 flex-col items-center rounded-2xl py-2 text-sm ring-1 disabled:opacity-40 ${day === d ? "bg-teal-600 text-white ring-teal-600" : "bg-white ring-slate-200"}`}>
                  <span className="text-xs opacity-70">{parts[0]}</span>
                  <span className="text-lg font-bold">{new Date(d + "T12:00:00").getDate()}</span>
                  {closed && <span className="text-xs">{t("bk.closed")}</span>}
                </button>
              );
            })}
          </div>

          {slotMap.size === 0 ? (
            <Card className="space-y-3 text-center">
              <p className="text-sm text-slate-600">{isClosedDay(day) ? t("ap.closed") : t("bk.noSlots")}</p>
              {!isClosedDay(day) && (
                <Btn icon={BellRing} variant="soft" disabled={alreadyWaiting} onClick={() => { s.joinWaitlist(s.meId, serviceId, doctorId, day); s.toast(t("toast.waitlisted")); }}>
                  {alreadyWaiting ? t("bk.onWaitlist") : t("bk.joinWaitlist")}
                </Btn>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {[...slotMap.keys()].map((slot) => (
                <button key={slot} onClick={() => setTime(slot)}
                  className={`rounded-xl py-2.5 text-sm font-semibold ring-1 ${time === slot ? "bg-teal-600 text-white ring-teal-600" : "bg-white ring-slate-200 hover:ring-teal-300"}`}>{slot}</button>
              ))}
            </div>
          )}

          {time && (
            <Card className="space-y-3">
              <div className="text-sm">
                <b>{service && loc(service.name)}</b> · {loc(s.doctors.find((d) => d.id === slotMap.get(time))!.name)}<br />
                <span className="font-mono">{date(day)} · {time}</span>
              </div>
              <Btn size="lg" className="w-full" onClick={confirm}>{t("ap.confirm")}</Btn>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
