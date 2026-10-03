"use client";

import { Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { money, todayIso } from "@/lib/utils";
import { Btn, Modal } from "./ui";

export default function Receipt({ patientName, patientId, onClose }: { patientName: string; patientId: string; onClose: () => void }) {
  const s = useStore();
  const { t, loc, date } = useI18n();
  const items = s.treatments.filter((x) => x.patientId === patientId && x.status === "done");
  const total = items.reduce((n, x) => n + x.price, 0);
  const paid = items.reduce((n, x) => n + x.paid, 0);
  return (
    <Modal title={t("b.receipt")} onClose={onClose}>
      <div id="print-area" className="space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div><div className="text-lg font-bold text-teal-700">{t("brand")}</div><div className="text-sm text-slate-500">{t("b.receiptSub")}</div></div>
          <div className="text-end text-sm text-slate-500">{date(todayIso())}</div>
        </div>
        <div><span className="text-slate-500">{t("b.patient")}:</span> <b>{patientName}</b></div>
        <table className="w-full">
          <tbody>
            {items.map((x) => (
              <tr key={x.id} className="border-b border-slate-100">
                <td className="py-1.5">{loc(s.services.find((v) => v.id === x.serviceId)!.name)}{x.tooth ? ` (#${x.tooth})` : ""}</td>
                <td className="py-1.5 text-end">{money(x.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between"><span>{t("b.total")}</span><b>{money(total)}</b></div>
        <div className="flex justify-between"><span>{t("b.paid")}</span><b className="text-emerald-600">{money(paid)}</b></div>
        <div className="flex justify-between"><span>{t("p.balance")}</span><b className="text-red-600">{money(total - paid)}</b></div>
      </div>
      <Btn className="no-print mt-4 w-full" icon={Printer} onClick={() => window.print()}>{t("b.print")}</Btn>
    </Modal>
  );
}

