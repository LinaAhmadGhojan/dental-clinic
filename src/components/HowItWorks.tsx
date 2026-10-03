"use client";

import { HelpCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

/** A short, dismissible guide in plain words: three steps for first-time users. */
export default function HowItWorks({ role }: { role: "staff" | "patient" }) {
  const { t } = useI18n();
  const key = `dentacare:guide:${role}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(key) !== "hidden");
    } catch {
      setOpen(true);
    }
  }, [key]);

  const set = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(key, v ? "shown" : "hidden");
    } catch {}
  };

  if (!open) {
    return (
      <button onClick={() => set(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm ring-1 ring-slate-200 hover:bg-teal-50">
        <HelpCircle className="h-4 w-4" />
        {t("how.show")}
      </button>
    );
  }

  return (
    <section className="relative rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-50 p-5 ring-1 ring-teal-200 sm:p-6">
      <button onClick={() => set(false)} aria-label={t("how.hide")} className="absolute end-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-white">
        <X className="h-5 w-5" />
      </button>
      <h2 className="mb-4 text-lg font-bold text-teal-900">{t(`how.${role}.title`)}</h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex items-start gap-3 rounded-2xl bg-white/80 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white">{n}</span>
            <span className="text-base leading-snug text-slate-700">{t(`how.${role}.${n}`)}</span>
          </li>
        ))}
      </ol>
      <button onClick={() => set(false)} className="mt-4 text-sm font-medium text-teal-700 underline">{t("how.hide")}</button>
    </section>
  );
}
