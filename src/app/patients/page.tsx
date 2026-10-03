"use client";

import { AlertTriangle, ArrowLeft, FileText, Pill, Plus, Printer, Search, Stethoscope, StickyNote, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import Odontogram, { CONDITIONS } from "@/components/Odontogram";
import { Avatar, Badge, Btn, Card, Empty, Modal, inputCls } from "@/components/ui";
import Receipt from "@/components/Receipt";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { ToothCondition } from "@/lib/types";
import { balanceOf, lastVisit, money, todayIso } from "@/lib/utils";

type Tab = "overview" | "chart" | "plan" | "rx" | "notes";

export default function Patients() {
  const s = useStore();
  const { t, date } = useI18n();
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [adding, setAdding] = useState(false);

  const list = useMemo(
    () => s.patients.filter((p) => (p.name + p.phone).toLowerCase().includes(q.toLowerCase())),
    [s.patients, q],
  );
  const patient = s.patients.find((p) => p.id === activeId);

  const tabs: { id: Tab; label: string; icon: typeof Stethoscope }[] = [
    { id: "overview", label: t("p.overview"), icon: FileText },
    { id: "chart", label: t("p.chart"), icon: Stethoscope },
    { id: "plan", label: t("p.plan"), icon: Wallet },
    { id: "rx", label: t("p.rx"), icon: Pill },
    { id: "notes", label: t("p.notes"), icon: StickyNote },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className={`space-y-3 ${patient ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("nav.patients")}</h1>
          <Btn size="sm" icon={Plus} onClick={() => setAdding(true)}>{t("p.new")}</Btn>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} ps-9`} placeholder={t("p.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ul className="space-y-2">
          {list.map((p) => {
            const bal = balanceOf(s, p.id);
            return (
              <li key={p.id}>
                <button onClick={() => { setActiveId(p.id); setTab("overview"); }}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start ring-1 transition ${p.id === activeId ? "bg-teal-600 text-white ring-teal-600" : "bg-white ring-slate-200 hover:ring-teal-300"}`}>
                  <Avatar name={p.name} color={p.id === activeId ? "#0f766e" : "#64748b"} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className={`truncate text-sm ${p.id === activeId ? "text-white/70" : "text-slate-500"}`}>{p.phone || "-"}</div>
                  </div>
                  {(p.allergies || p.conditions) && <AlertTriangle className={`h-4 w-4 ${p.id === activeId ? "text-amber-200" : "text-amber-500"}`} />}
                  {bal > 0 && <Badge tone="red">{money(bal)}</Badge>}
                </button>
              </li>
            );
          })}
          {list.length === 0 && <Empty icon={Search} text={t("empty.none")} />}
        </ul>
      </aside>

      {patient ? (
        <div className="min-w-0 space-y-4">
          <button onClick={() => setActiveId(null)} className="flex items-center gap-1 text-sm text-teal-700 lg:hidden"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("nav.patients")}</button>
          <Card className="flex flex-wrap items-center gap-4">
            <Avatar name={patient.name} size={56} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <p className="text-sm text-slate-500">{patient.age ? `${patient.age} ${t("p.years")} · ` : ""}{patient.phone}</p>
              <p className="text-sm text-slate-400">{t("p.lastVisit")}: {lastVisit(s, patient.id) ? date(lastVisit(s, patient.id)!) : "-"}</p>
            </div>
            <div className="text-end">
              <div className="text-sm text-slate-500">{t("p.balance")}</div>
              <div className={`text-xl font-bold ${balanceOf(s, patient.id) > 0 ? "text-red-600" : "text-emerald-600"}`}>{money(balanceOf(s, patient.id))}</div>
            </div>
          </Card>

          {(patient.allergies || patient.conditions) && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <b>{t("p.alerts")}</b>
                <div>{patient.allergies && <>{t("p.allergies")}: {patient.allergies}. </>}{patient.conditions && <>{t("p.conditions")}: {patient.conditions}.</>}</div>
              </div>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-slate-200">
            {tabs.map((x) => (
              <button key={x.id} onClick={() => setTab(x.id)}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${tab === x.id ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50"}`}>
                <x.icon className="h-4 w-4" /><span className="hidden sm:inline">{x.label}</span>
              </button>
            ))}
          </div>

          {tab === "overview" && <Overview id={patient.id} />}
          {tab === "chart" && <Chart id={patient.id} />}
          {tab === "plan" && <Plan id={patient.id} />}
          {tab === "rx" && <Rx id={patient.id} />}
          {tab === "notes" && <Notes id={patient.id} />}
        </div>
      ) : (
        <div className="hidden items-center justify-center rounded-3xl border border-dashed border-slate-300 p-10 text-slate-400 lg:flex">{t("p.select")}</div>
      )}

      {adding && <AddPatient onClose={() => setAdding(false)} onCreated={(id) => { setActiveId(id); setTab("overview"); }} />}
    </div>
  );
}

function AddPatient({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const s = useStore();
  const { t } = useI18n();
  const [f, setF] = useState({ name: "", phone: "", age: "", allergies: "", conditions: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onCreated(s.addPatient({ name: f.name.trim(), phone: f.phone, age: Number(f.age) || 0, allergies: f.allergies, conditions: f.conditions, notes: "", recallMonths: 6 }));
    s.toast(t("toast.patientAdded"));
    onClose();
  };
  return (
    <Modal title={t("p.new")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className={inputCls} placeholder={t("f.name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder={t("f.phone")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t("f.age")} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
        </div>
        <input className={inputCls} placeholder={t("p.allergies")} value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} />
        <input className={inputCls} placeholder={t("p.conditions")} value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} />
        <Btn className="w-full" size="lg">{t("p.save")}</Btn>
      </form>
    </Modal>
  );
}

function Overview({ id }: { id: string }) {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const p = s.patients.find((x) => x.id === id)!;
  const appts = s.appointments.filter((a) => a.patientId === id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3">
        <h3 className="font-semibold">{t("p.details")}</h3>
        {(["phone", "allergies", "conditions", "notes"] as const).map((k) => (
          <label key={k} className="block text-sm text-slate-500">
            {k === "phone" ? t("f.phone") : k === "allergies" ? t("p.allergies") : k === "conditions" ? t("p.conditions") : t("p.notesField")}
            <input className={`${inputCls} mt-1`} value={p[k]} onChange={(e) => s.updatePatient(id, { [k]: e.target.value })} />
          </label>
        ))}
        <label className="block text-sm text-slate-500">
          {t("p.recall")}
          <select className={`${inputCls} mt-1`} value={p.recallMonths} onChange={(e) => s.updatePatient(id, { recallMonths: Number(e.target.value) })}>
            {[3, 6, 12].map((m) => <option key={m} value={m}>{m} {t("unit.months")}</option>)}
          </select>
        </label>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">{t("p.visits")}</h3>
        {appts.length === 0 ? <Empty icon={FileText} text={t("empty.none")} /> : (
          <ul className="space-y-2 text-sm">
            {appts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5">
                <span>{date(a.date)} · {a.time}<span className="block text-sm text-slate-500">{loc(s.services.find((x) => x.id === a.serviceId)!.name)}</span></span>
                <Badge tone={a.status === "done" ? "green" : a.status === "booked" ? "teal" : a.status === "arrived" ? "amber" : "red"}>{t(`status.${a.status}`)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Chart({ id }: { id: string }) {
  const s = useStore();
  const { t, loc } = useI18n();
  const [tooth, setTooth] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState(s.services[2].id);
  const chart = s.teeth[id] ?? {};
  const planned = s.treatments.filter((x) => x.patientId === id && x.status === "planned" && x.tooth).map((x) => x.tooth!);
  const doctorId = s.doctors[0].id;

  return (
    <Card>
      <Odontogram teeth={chart} selected={tooth} planned={planned} onSelect={setTooth} />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        {CONDITIONS.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded border border-slate-400" style={{ background: c.fill }} />{t(`cond.${c.id}`)}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-full bg-amber-400" />{t("p.plannedDot")}</span>
      </div>
      {tooth ? (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="text-sm font-semibold">{t("p.tooth")} {tooth}</div>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button key={c.id} onClick={() => s.setTooth(id, tooth, c.id as ToothCondition)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${(chart[tooth] ?? "healthy") === c.id ? "bg-teal-600 text-white ring-teal-600" : "bg-white ring-slate-300"}`}>{t(`cond.${c.id}`)}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${inputCls} flex-1`} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {s.services.map((x) => <option key={x.id} value={x.id}>{loc(x.name)} (${x.price})</option>)}
            </select>
            <Btn variant="soft" onClick={() => { s.addTreatment({ patientId: id, doctorId, tooth, serviceId, price: s.services.find((x) => x.id === serviceId)!.price, date: todayIso(), status: "planned" }); s.toast(t("toast.planAdded")); }}>{t("p.addToPlan")}</Btn>
          </div>
        </div>
      ) : <p className="mt-4 text-sm text-slate-400">{t("p.tapTooth")}</p>}
    </Card>
  );
}

function Plan({ id }: { id: string }) {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const [receipt, setReceipt] = useState(false);
  const items = s.treatments.filter((x) => x.patientId === id);
  const planned = items.filter((x) => x.status === "planned");
  const done = items.filter((x) => x.status === "done");
  const estimate = planned.reduce((n, x) => n + x.price, 0);
  const patient = s.patients.find((p) => p.id === id)!;
  const row = (x: (typeof items)[number]) => (
    <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
      <span>
        <b>{loc(s.services.find((v) => v.id === x.serviceId)!.name)}</b>
        {x.tooth && <span className="text-slate-500"> · {t("p.tooth")} {x.tooth}</span>}
        <span className="block text-sm text-slate-400">{date(x.date)}</span>
      </span>
      <span className="flex items-center gap-2">
        {x.status === "planned" ? (
          <>
            <span className="font-semibold">{money(x.price)}</span>
            <Btn size="sm" variant="green" onClick={() => s.setTreatmentStatus(x.id, "done")}>{t("p.markDone")}</Btn>
          </>
        ) : (
          <>
            <span>{money(x.paid)} / {money(x.price)}</span>
            {x.paid < x.price ? <Btn size="sm" onClick={() => s.pay(x.id, x.price - x.paid)}>{t("b.receive")}</Btn> : <Badge tone="green">{t("b.paid")}</Badge>}
          </>
        )}
      </span>
    </li>
  );
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">{t("p.treatmentPlan")}</h3>
          <Badge tone="amber">{t("p.estimate")}: {money(estimate)}</Badge>
        </div>
        {planned.length === 0 ? <Empty icon={Wallet} text={t("p.noPlan")} /> : <ul className="divide-y divide-slate-100">{planned.map(row)}</ul>}
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">{t("p.completed")}</h3>
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" icon={Printer} onClick={() => setReceipt(true)}>{t("b.receipt")}</Btn>
            <Btn size="sm" disabled={balanceOf(s, id) === 0} onClick={() => { s.payAll(id); s.toast(t("toast.paid")); }}>{t("b.payAll")}</Btn>
          </div>
        </div>
        {done.length === 0 ? <Empty icon={Wallet} text={t("empty.none")} /> : <ul className="divide-y divide-slate-100">{done.map(row)}</ul>}
      </Card>
      {receipt && <Receipt patientName={patient.name} patientId={id} onClose={() => setReceipt(false)} />}
    </div>
  );
}

function Rx({ id }: { id: string }) {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const [drug, setDrug] = useState("");
  const [dose, setDose] = useState("");
  const [days, setDays] = useState("5");
  const [items, setItems] = useState<{ drug: string; dose: string; days: number }[]>([]);
  const [printing, setPrinting] = useState<string | null>(null);
  const patient = s.patients.find((p) => p.id === id)!;
  const list = s.prescriptions.filter((x) => x.patientId === id);
  const printRx = list.find((x) => x.id === printing);

  const addItem = () => {
    if (!drug.trim()) return;
    setItems([...items, { drug: drug.trim(), dose: dose.trim(), days: Number(days) || 1 }]);
    setDrug(""); setDose("");
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h3 className="font-semibold">{t("rx.new")}</h3>
        {patient.allergies && <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-800">⚠ {t("p.allergies")}: {patient.allergies}</div>}
        <div className="grid gap-2 sm:grid-cols-[1.5fr_1.5fr_80px_auto]">
          <input className={inputCls} placeholder={t("rx.drug")} value={drug} onChange={(e) => setDrug(e.target.value)} />
          <input className={inputCls} placeholder={t("rx.dose")} value={dose} onChange={(e) => setDose(e.target.value)} />
          <input className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} aria-label={t("rx.days")} />
          <Btn variant="soft" icon={Plus} onClick={addItem}>{t("rx.add")}</Btn>
        </div>
        {items.length > 0 && (
          <ul className="space-y-1 text-sm">
            {items.map((i, n) => <li key={n} className="rounded-lg bg-slate-50 px-3 py-2">{i.drug} · {i.dose} · {i.days} {t("unit.days")}</li>)}
          </ul>
        )}
        <Btn disabled={items.length === 0} onClick={() => { s.addPrescription({ patientId: id, doctorId: s.doctors[0].id, items }); setItems([]); s.toast(t("toast.rxSaved")); }}>{t("rx.save")}</Btn>
      </Card>

      <Card>
        <h3 className="mb-2 font-semibold">{t("p.rx")}</h3>
        {list.length === 0 ? <Empty icon={Pill} text={t("empty.none")} /> : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <b>{date(r.date)} · {loc(s.doctors.find((d) => d.id === r.doctorId)!.name)}</b>
                  <Btn size="sm" variant="ghost" icon={Printer} onClick={() => setPrinting(r.id)}>{t("b.print")}</Btn>
                </div>
                {r.items.map((i, n) => <div key={n} className="text-slate-600">• {i.drug} — {i.dose} ({i.days} {t("unit.days")})</div>)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {printRx && (
        <Modal title={t("p.rx")} onClose={() => setPrinting(null)}>
          <div id="print-area" className="space-y-3 text-sm">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-lg font-bold text-teal-700">{t("brand")}</div>
              <div className="text-sm text-slate-500">{loc(s.doctors.find((d) => d.id === printRx.doctorId)!.name)} · {date(printRx.date)}</div>
            </div>
            <div><span className="text-slate-500">{t("b.patient")}:</span> <b>{patient.name}</b></div>
            <ol className="list-decimal space-y-2 ps-5">
              {printRx.items.map((i, n) => <li key={n}><b>{i.drug}</b><div className="text-slate-600">{i.dose} · {i.days} {t("unit.days")}</div></li>)}
            </ol>
          </div>
          <Btn className="no-print mt-4 w-full" icon={Printer} onClick={() => window.print()}>{t("b.print")}</Btn>
        </Modal>
      )}
    </div>
  );
}

function Notes({ id }: { id: string }) {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const [text, setText] = useState("");
  const list = s.notes.filter((n) => n.patientId === id);
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <textarea className={inputCls} rows={3} placeholder={t("n.placeholder")} value={text} onChange={(e) => setText(e.target.value)} />
        <Btn disabled={!text.trim()} onClick={() => { s.addNote(id, s.doctors[0].id, text.trim()); setText(""); s.toast(t("toast.noteSaved")); }}>{t("n.save")}</Btn>
      </Card>
      <Card>
        {list.length === 0 ? <Empty icon={StickyNote} text={t("empty.none")} /> : (
          <ul className="space-y-3">
            {list.map((n) => (
              <li key={n.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                <div className="mb-1 text-sm text-slate-500">{date(n.date)} · {loc(s.doctors.find((d) => d.id === n.doctorId)!.name)}</div>
                {n.text}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
