"use client";

import { Banknote, CheckCircle2, Printer, Receipt as ReceiptIcon, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import Receipt from "@/components/Receipt";
import { Avatar, Badge, Btn, Card, Empty, PageHeader, StatCard } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { balanceOf, money } from "@/lib/utils";

export default function Billing() {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [receiptFor, setReceiptFor] = useState<string | null>(null);

  const done = s.treatments.filter((x) => x.status === "done");
  const billed = done.reduce((n, x) => n + x.price, 0);
  const paid = done.reduce((n, x) => n + x.paid, 0);

  const groups = useMemo(
    () =>
      s.patients
        .map((p) => ({ p, items: done.filter((x) => x.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date)), balance: balanceOf(s, p.id) }))
        .filter((g) => g.items.length > 0 && (!unpaidOnly || g.balance > 0)),
    [s, done, unpaidOnly],
  );
  const receiptPatient = s.patients.find((p) => p.id === receiptFor);

  return (
    <div className="space-y-5">
      <PageHeader title={t("b.title")} subtitle={t("b.sub")} actions={
        <Btn variant={unpaidOnly ? "primary" : "ghost"} onClick={() => setUnpaidOnly(!unpaidOnly)}>{t("b.unpaidOnly")}</Btn>
      } />
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={ReceiptIcon} label={t("b.billed")} value={money(billed)} />
        <StatCard icon={Banknote} label={t("b.collected")} value={money(paid)} tone="green" />
        <StatCard icon={Wallet} label={t("dash.outstanding")} value={money(billed - paid)} tone="red" />
      </div>

      {groups.length === 0 ? <Card><Empty icon={CheckCircle2} text={t("b.allClear")} /></Card> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map(({ p, items, balance }) => (
            <Card key={p.id}>
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={p.name} />
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.phone}</div>
                </div>
                {balance > 0 ? <Badge tone="red">{t("p.balance")}: {money(balance)}</Badge> : <Badge tone="green">{t("b.paid")}</Badge>}
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {items.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-2 py-2">
                    <span>{loc(s.services.find((v) => v.id === x.serviceId)!.name)}{x.tooth ? ` #${x.tooth}` : ""}<span className="block text-sm text-slate-400">{date(x.date)}</span></span>
                    <span className="flex items-center gap-2">
                      {money(x.paid)}/{money(x.price)}
                      {x.paid < x.price && <Btn size="sm" variant="soft" onClick={() => { s.pay(x.id, x.price - x.paid); s.toast(t("toast.paid")); }}>{t("b.receive")}</Btn>}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Btn size="sm" disabled={balance === 0} onClick={() => { s.payAll(p.id); s.toast(t("toast.paid")); }}>{t("b.payAll")}</Btn>
                <Btn size="sm" variant="ghost" icon={Printer} onClick={() => setReceiptFor(p.id)}>{t("b.receipt")}</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {receiptPatient && <Receipt patientName={receiptPatient.name} patientId={receiptPatient.id} onClose={() => setReceiptFor(null)} />}
    </div>
  );
}
