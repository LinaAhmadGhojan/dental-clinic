"use client";

import { AlertTriangle, ArrowRightCircle, CheckCircle2, Clock, Footprints, LogOut, Monitor, Play, Plus, TimerReset, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, Badge, Btn, Card, Empty, Modal, PageHeader, inputCls } from "@/components/ui";
import { CrowdBanner } from "@/components/LiveParts";
import { useI18n } from "@/lib/i18n";
import { doctorQueue, hhmm, svcMin } from "@/lib/queue";
import { useNow, useStore } from "@/lib/store";
import type { Ticket } from "@/lib/types";
import { todayIso } from "@/lib/utils";

export default function QueuePage() {
  const s = useStore();
  const { t, loc } = useI18n();
  const now = useNow(10000);
  const [walkin, setWalkin] = useState(false);
  const [finishing, setFinishing] = useState<Ticket | null>(null);

  const pName = (id: string) => s.patients.find((p) => p.id === id)?.name ?? "";
  const svcName = (id: string) => loc(s.services.find((x) => x.id === id)!.name);
  const today = todayIso();
  const expected = s.appointments.filter(
    (a) => a.date === today && a.status === "booked" && !s.tickets.some((x) => x.apptId === a.id && x.status !== "left"),
  );
  const done = s.tickets.filter((x) => x.status === "done").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("q.title")}
        subtitle={t("q.sub")}
        actions={
          <>
            <Link href="/display"><Btn variant="ghost" icon={Monitor}>{t("nav.tv")}</Btn></Link>
            <Btn icon={UserPlus} onClick={() => setWalkin(true)}>{t("dash.walkin")}</Btn>
          </>
        }
      />

      <CrowdBanner />

      <div className={`grid gap-5 ${s.doctors.length > 1 ? "xl:grid-cols-2" : ""}`}>
        {s.doctors.map((d) => {
          const q = doctorQueue(s, d.id, now);
          const late = s.delays[d.id] ?? 0;
          const elapsed = q.chair?.startedAt ? Math.floor((now - q.chair.startedAt) / 60000) : 0;
          const total = q.chair ? svcMin(s, q.chair) : 1;
          return (
            <Card key={d.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={loc(d.name)} color={d.color} size={44} />
                  <div>
                    <div className="font-semibold">{loc(d.name)}</div>
                    <div className="text-sm text-slate-500">{loc(d.specialty)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-500"><TimerReset className="me-1 inline h-3.5 w-3.5" />{t("q.runningLate")}</span>
                  {[0, 10, 20].map((m) => (
                    <button key={m} onClick={() => { s.setDelay(d.id, m); s.toast(m ? t("toast.delay", { n: m }) : t("toast.delayCleared")); }}
                      className={`rounded-lg px-2 py-1 text-sm font-medium ring-1 ${late === m ? "bg-amber-500 text-white ring-amber-500" : "bg-white text-slate-600 ring-slate-200"}`}>
                      {m ? `+${m}` : t("q.onTime")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chair */}
              {q.chair ? (
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium uppercase tracking-wide text-amber-700">{t("q.inChair")}</div>
                      <div className="text-lg font-bold">#{q.chair.number} · {pName(q.chair.patientId)}</div>
                      <div className="text-sm text-slate-600">{svcName(q.chair.serviceId)}</div>
                    </div>
                    <Btn variant="green" icon={CheckCircle2} onClick={() => setFinishing(q.chair!)}>{t("q.finish")}</Btn>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
                    <div className={`h-full rounded-full ${elapsed > total ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-slate-500">
                    <span>{elapsed} / {total} {t("unit.min")}</span>
                    {elapsed > total && <span className="font-medium text-red-600">{t("q.overrun")}</span>}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">{t("live.chairFree")}</div>
              )}

              {!q.chair && q.rows.length > 0 && (
                <Btn size="lg" className="w-full" icon={Play} onClick={() => { s.startTicket(q.rows[0].ticket.id); s.toast(t("toast.called", { name: pName(q.rows[0].ticket.patientId) })); }}>
                  {t("q.callNext")}: #{q.rows[0].ticket.number} {pName(q.rows[0].ticket.patientId)}
                </Btn>
              )}

              {/* Waiting */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                  <span>{t("q.waiting")} ({q.rows.length})</span>
                  <span className="text-sm font-normal text-slate-500">{t("live.waitNew")}: ~{q.newArrivalWait} {t("unit.min")}</span>
                </div>
                {q.rows.length === 0 ? <Empty icon={Clock} text={t("q.noWaiting")} /> : (
                  <ul className="space-y-2">
                    {q.rows.map((r) => (
                      <li key={r.ticket.id} className={`rounded-2xl p-3 ring-1 ${r.ticket.emergency ? "bg-red-50 ring-red-200" : "bg-white ring-slate-200"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">#{r.ticket.number}</span>
                            <div>
                              <div className="font-medium">{pName(r.ticket.patientId)}</div>
                              <div className="text-sm text-slate-500">{svcName(r.ticket.serviceId)} · {t("q.arrived")} {hhmm(r.ticket.arrivedAt)}</div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="text-sm font-bold text-teal-700">~{r.waitMin} {t("unit.min")}</div>
                            <div className="text-xs text-slate-400">{r.ahead} {t("track.ahead")}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {r.ticket.emergency && <Badge tone="red"><AlertTriangle className="h-3 w-3" />{t("q.emergency")}</Badge>}
                          {r.ticket.onTheWay && <Badge tone="blue"><Footprints className="h-3 w-3" />{t("q.onTheWay")}</Badge>}
                          {r.ticket.kind === "walkin" && <Badge>{t("q.walkin")}</Badge>}
                          <span className="flex-1" />
                          {r.ticket.onTheWay && <Btn size="sm" variant="soft" onClick={() => s.markArrived(r.ticket.id)}>{t("q.markArrived")}</Btn>}
                          <Btn size="sm" variant="ghost" onClick={() => s.toggleEmergency(r.ticket.id)}>{r.ticket.emergency ? t("q.normal") : t("q.makeUrgent")}</Btn>
                          <Btn size="sm" variant="danger" icon={LogOut} onClick={() => s.leaveTicket(r.ticket.id)} aria-label={t("q.remove")} />
                          <Btn size="sm" icon={Play} disabled={!!q.chair} onClick={() => { s.startTicket(r.ticket.id); s.toast(t("toast.called", { name: pName(r.ticket.patientId) })); }}>
                            {t("q.call")}
                          </Btn>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("q.expected")} ({expected.length})</h2>
          <span className="text-sm text-slate-500">{t("q.doneToday", { n: done })}</span>
        </div>
        {expected.length === 0 ? <Empty icon={ArrowRightCircle} text={t("q.noExpected")} /> : (
          <ul className="divide-y divide-slate-100">
            {expected.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="w-14 font-mono font-semibold">{a.time}</span>
                <span className="flex-1 font-medium">{pName(a.patientId)} <span className="font-normal text-slate-500">· {svcName(a.serviceId)}</span></span>
                <Btn size="sm" variant="soft" icon={Plus} onClick={() => { s.checkIn({ patientId: a.patientId, doctorId: a.doctorId, serviceId: a.serviceId, apptId: a.id }); s.toast(t("toast.checkedIn")); }}>{t("q.checkIn")}</Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {walkin && <WalkInModal onClose={() => setWalkin(false)} />}
      {finishing && <FinishModal ticket={finishing} onClose={() => setFinishing(null)} />}
    </div>
  );
}

function WalkInModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const { t, loc } = useI18n();
  const [patientId, setPatientId] = useState(s.patients[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [doctorId, setDoctorId] = useState(s.doctors[0].id);
  const [serviceId, setServiceId] = useState(s.services[0].id);
  const [emergency, setEmergency] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let pid = patientId;
    if (patientId === "__new") {
      if (!newName.trim()) return;
      pid = s.addPatient({ name: newName.trim(), phone: "", age: 0, allergies: "", conditions: "", notes: "", recallMonths: 6 });
    }
    s.checkIn({ patientId: pid, doctorId, serviceId, emergency });
    s.toast(t("toast.checkedIn"));
    onClose();
  };

  return (
    <Modal title={t("dash.walkin")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value="__new">+ {t("p.new")}</option>
        </select>
        {patientId === "__new" && <input className={inputCls} placeholder={t("f.name")} value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />}
        {s.doctors.length > 1 && (
          <select className={inputCls} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {s.doctors.map((d) => <option key={d.id} value={d.id}>{loc(d.name)}</option>)}
          </select>
        )}
        <select className={inputCls} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {s.services.map((x) => <option key={x.id} value={x.id}>{loc(x.name)} · {x.minutes} {t("unit.min")}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="h-4 w-4 accent-red-600" />
          <AlertTriangle className="h-4 w-4" /> {t("q.emergencyHint")}
        </label>
        <Btn className="w-full" size="lg">{t("q.addToQueue")}</Btn>
      </form>
    </Modal>
  );
}

function FinishModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const s = useStore();
  const { t, loc } = useI18n();
  const [picked, setPicked] = useState<Record<string, boolean>>({ [ticket.serviceId]: true });
  const [tooth, setTooth] = useState("");
  const [note, setNote] = useState("");
  const patient = s.patients.find((p) => p.id === ticket.patientId);
  const total = s.services.filter((x) => picked[x.id]).reduce((n, x) => n + x.price, 0);

  const submit = () => {
    const toothNo = Number(tooth) || null;
    const items = s.services.filter((x) => picked[x.id]).map((x) => ({ serviceId: x.id, tooth: toothNo }));
    s.finishTicket(ticket.id, items, note);
    s.toast(t("toast.visitDone"));
    onClose();
  };

  return (
    <Modal title={`${t("q.finish")} · ${patient?.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        {patient && (patient.allergies || patient.conditions) && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            <b>⚠ {t("p.alerts")}:</b> {[patient.allergies && `${t("p.allergies")}: ${patient.allergies}`, patient.conditions].filter(Boolean).join(" · ")}
          </div>
        )}
        <div>
          <div className="mb-2 text-sm font-semibold">{t("q.procedures")}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {s.services.map((x) => (
              <label key={x.id} className={`flex cursor-pointer items-center gap-2 rounded-xl p-2.5 text-sm ring-1 ${picked[x.id] ? "bg-teal-50 ring-teal-400" : "ring-slate-200"}`}>
                <input type="checkbox" className="accent-teal-600" checked={!!picked[x.id]} onChange={(e) => setPicked({ ...picked, [x.id]: e.target.checked })} />
                <span className="flex-1">{loc(x.name)}</span>
                <span className="text-slate-500">${x.price}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <input className={inputCls} type="number" min={11} max={48} placeholder={t("f.tooth")} value={tooth} onChange={(e) => setTooth(e.target.value)} />
          <textarea className={inputCls} rows={2} placeholder={t("q.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <span className="text-sm text-slate-600">{t("q.invoiceTotal")}</span>
          <b className="text-lg">${total}</b>
        </div>
        <Btn className="w-full" size="lg" variant="green" disabled={total === 0} onClick={submit}>{t("q.completeVisit")}</Btn>
      </div>
    </Modal>
  );
}
