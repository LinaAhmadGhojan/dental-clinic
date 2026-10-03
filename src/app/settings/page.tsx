"use client";

import { Clock, ExternalLink, Monitor, Plus, Radio } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, Btn, Card, PageHeader, inputCls } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const s = useStore();
  const { t, loc } = useI18n();
  const [en, setEn] = useState("");
  const [ar, setAr] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [price, setPrice] = useState(50);

  return (
    <div className="space-y-5">
      <PageHeader title={t("set.title")} subtitle={t("set.sub")} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">{t("set.doctors")}</h2>
          <ul className="space-y-3">
            {s.doctors.map((d) => (
              <li key={d.id} className="flex items-center gap-3">
                <Avatar name={loc(d.name)} color={d.color} size={44} />
                <div><div className="font-medium">{loc(d.name)}</div><div className="text-sm text-slate-500">{loc(d.specialty)}</div></div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />{t("set.hours")}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">{t("set.links")}</h2>
          <p className="mb-3 text-sm text-slate-500">{t("set.linksHint")}</p>
          <div className="space-y-2">
            <Link href="/live" className="flex items-center justify-between rounded-xl bg-teal-50 p-3 text-sm font-medium text-teal-800"><span className="flex items-center gap-2"><Radio className="h-4 w-4" />{t("set.liveLink")}</span><ExternalLink className="h-4 w-4" /></Link>
            <Link href="/display" className="flex items-center justify-between rounded-xl bg-violet-50 p-3 text-sm font-medium text-violet-800"><span className="flex items-center gap-2"><Monitor className="h-4 w-4" />{t("set.tvLink")}</span><ExternalLink className="h-4 w-4" /></Link>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">{t("set.services")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-start text-sm text-slate-500">
              <tr><th className="p-2 text-start">{t("f.service")}</th><th className="p-2 text-start">{t("set.duration")}</th><th className="p-2 text-start">{t("set.price")}</th></tr>
            </thead>
            <tbody>
              {s.services.map((x) => (
                <tr key={x.id} className="border-t border-slate-100">
                  <td className="p-2 font-medium">{loc(x.name)}</td>
                  <td className="p-2"><input type="number" className={`${inputCls} w-24`} value={x.minutes} min={10} step={5} onChange={(e) => s.updateService(x.id, { minutes: Number(e.target.value) || 10 })} /></td>
                  <td className="p-2"><input type="number" className={`${inputCls} w-24`} value={x.price} min={0} onChange={(e) => s.updateService(x.id, { price: Number(e.target.value) || 0 })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_90px_90px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!en.trim() && !ar.trim()) return;
            s.addService({ name: { en: en.trim() || ar.trim(), ar: ar.trim() || en.trim() }, minutes, price });
            setEn(""); setAr("");
            s.toast(t("toast.serviceAdded"));
          }}
        >
          <input className={inputCls} placeholder="English name" value={en} onChange={(e) => setEn(e.target.value)} />
          <input className={inputCls} placeholder="الاسم بالعربي" value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" />
          <input className={inputCls} type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label={t("set.duration")} />
          <input className={inputCls} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-label={t("set.price")} />
          <Btn icon={Plus}>{t("set.add")}</Btn>
        </form>
      </Card>
    </div>
  );
}
