"use client";

import { Radio } from "lucide-react";
import { CrowdBanner, DoctorStatusCards, TrackerCard } from "@/components/LiveParts";
import { Card, PageHeader, inputCls } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useState } from "react";

/** Public page: anyone can check how busy the clinic is before leaving home. */
export default function Live() {
  const s = useStore();
  const { t } = useI18n();
  const [who, setWho] = useState(s.meId);
  const patientId = s.role === "patient" ? s.meId : who;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("live.title")} subtitle={t("live.sub")} />
      <CrowdBanner />
      <DoctorStatusCards />

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Radio className="h-5 w-5 text-teal-600" />{t("track.title")}</h2>
        {s.role === "staff" && (
          <Card className="mb-3">
            <label className="text-sm text-slate-600">{t("live.viewAs")}
              <select className={`${inputCls} mt-1`} value={who} onChange={(e) => setWho(e.target.value)}>
                {s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          </Card>
        )}
        <TrackerCard key={patientId} patientId={patientId} />
      </div>
      <p className="text-center text-sm text-slate-400">{t("live.autoRefresh")}</p>
    </div>
  );
}
