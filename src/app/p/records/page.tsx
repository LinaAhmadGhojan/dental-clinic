"use client";

import { Pill, Printer, Receipt as ReceiptIcon, StickyNote } from "lucide-react";
import { useState } from "react";
import Odontogram, { CONDITIONS } from "@/components/Odontogram";
import Receipt from "@/components/Receipt";
import { Badge, Btn, Card, Empty, Modal, PageHeader, Stars, inputCls } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { balanceOf, money } from "@/lib/utils";

export default function Records() {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const me = s.patients.find((p) => p.id === s.meId)!;
  const [receipt, setReceipt] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [printing, setPrinting] = useState<string | null>(null);

  const treatments = s.treatments.filter((x) => x.patientId === me.id);
  const done = treatments.filter((x) => x.status === "done");
  const planned = treatments.filter((x) => x.status === "planned");
  const balance = balanceOf(s, me.id);
  const rx = s.prescriptions.filter((x) => x.patientId === me.id);
  const notes = s.notes.filter((x) => x.patientId === me.id);
  const reviewed = s.feedback.some((f) => f.patientId === me.id && f.date === new Date().toISOString().slice(0, 10));
  const justVisited = s.appointments.some((a) => a.patientId === me.id && a.status === "done" && a.date === new Date().toISOString().slice(0, 10));
  const printRx = rx.find((x) => x.id === printing);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("nav.records")} subtitle={me.name} />

      <div className="grid grid-cols-2 gap-3">
        <Card><div className="text-sm text-slate-500">{t("b.total")}</div><div className="text-2xl font-bold">{money(done.reduce((n, x) => n + x.price, 0))}</div></Card>
        <Card><div className="text-sm text-slate-500">{t("p.balance")}</div><div className={`text-2xl font-bold ${balance ? "text-red-600" : "text-emerald-600"}`}>{money(balance)}</div></Card>
      </div>

      {balance > 0 && (
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => { s.payAll(me.id); s.toast(t("toast.paid")); }}>{t("rec.payOnline")}</Btn>
          <Btn variant="ghost" icon={ReceiptIcon} onClick={() => setReceipt(true)}>{t("b.receipt")}</Btn>
        </div>
      )}

      {justVisited && !reviewed && (
        <Card className="space-y-3 bg-amber-50 ring-amber-200">
          <h2 className="font-semibold">{t("rec.rateTitle")}</h2>
          <Stars value={rating} onChange={setRating} />
          <textarea className={inputCls} rows={2} placeholder={t("rec.comment")} value={comment} onChange={(e) => setComment(e.target.value)} />
          <Btn disabled={!rating} onClick={() => { s.addFeedback({ patientId: me.id, rating, comment }); s.toast(t("toast.thanks")); }}>{t("rec.submit")}</Btn>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 font-semibold">{t("p.chart")}</h2>
        <Odontogram teeth={s.teeth[me.id] ?? {}} planned={planned.filter((x) => x.tooth).map((x) => x.tooth!)} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          {CONDITIONS.map((c) => <span key={c.id} className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded border border-slate-400" style={{ background: c.fill }} />{t(`cond.${c.id}`)}</span>)}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">{t("p.treatmentPlan")}</h2>
        {planned.length === 0 ? <Empty icon={ReceiptIcon} text={t("p.noPlan")} /> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {planned.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2"><span>{loc(s.services.find((v) => v.id === x.serviceId)!.name)}{x.tooth ? ` · ${t("p.tooth")} ${x.tooth}` : ""}</span><b>{money(x.price)}</b></li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">{t("p.completed")}</h2>
        {done.length === 0 ? <Empty icon={ReceiptIcon} text={t("empty.none")} /> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {done.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 py-2">
                <span>{loc(s.services.find((v) => v.id === x.serviceId)!.name)}{x.tooth ? ` #${x.tooth}` : ""}<span className="block text-sm text-slate-400">{date(x.date)}</span></span>
                {x.paid >= x.price ? <Badge tone="green">{t("b.paid")}</Badge> : <Badge tone="red">{money(x.price - x.paid)}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><Pill className="h-4 w-4 text-teal-600" />{t("p.rx")}</h2>
        {rx.length === 0 ? <div className="text-sm text-slate-400">{t("empty.none")}</div> : rx.map((r) => (
          <div key={r.id} className="mb-2 rounded-2xl bg-slate-50 p-3 text-sm">
            <div className="mb-1 flex items-center justify-between"><b>{date(r.date)}</b><Btn size="sm" variant="ghost" icon={Printer} onClick={() => setPrinting(r.id)}>{t("b.print")}</Btn></div>
            {r.items.map((i, n) => <div key={n} className="text-slate-600">• {i.drug} — {i.dose} ({i.days} {t("unit.days")})</div>)}
          </div>
        ))}
      </Card>

      {notes.length > 0 && (
        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><StickyNote className="h-4 w-4 text-teal-600" />{t("rec.doctorNotes")}</h2>
          {notes.map((n) => <div key={n.id} className="mb-2 rounded-2xl bg-slate-50 p-3 text-sm"><div className="mb-1 text-sm text-slate-400">{date(n.date)}</div>{n.text}</div>)}
        </Card>
      )}

      {receipt && <Receipt patientName={me.name} patientId={me.id} onClose={() => setReceipt(false)} />}
      {printRx && (
        <Modal title={t("p.rx")} onClose={() => setPrinting(null)}>
          <div id="print-area" className="space-y-3 text-sm">
            <div className="border-b border-slate-200 pb-3"><div className="text-lg font-bold text-teal-700">{t("brand")}</div><div className="text-sm text-slate-500">{loc(s.doctors.find((d) => d.id === printRx.doctorId)!.name)} · {date(printRx.date)}</div></div>
            <div><span className="text-slate-500">{t("b.patient")}:</span> <b>{me.name}</b></div>
            <ol className="list-decimal space-y-2 ps-5">{printRx.items.map((i, n) => <li key={n}><b>{i.drug}</b><div className="text-slate-600">{i.dose} · {i.days} {t("unit.days")}</div></li>)}</ol>
          </div>
          <Btn className="no-print mt-4 w-full" icon={Printer} onClick={() => window.print()}>{t("b.print")}</Btn>
        </Modal>
      )}
    </div>
  );
}
