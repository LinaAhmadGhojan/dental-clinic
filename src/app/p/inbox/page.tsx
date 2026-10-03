"use client";

import { BellRing, CalendarCheck, Clock, Info, MessageSquareHeart, Navigation } from "lucide-react";
import { Btn, Empty, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { hhmm } from "@/lib/queue";
import { useStore } from "@/lib/store";
import type { Message } from "@/lib/types";

const icons: Record<Message["kind"], { icon: typeof Info; cls: string }> = {
  booking: { icon: CalendarCheck, cls: "bg-teal-50 text-teal-700" },
  reminder: { icon: BellRing, cls: "bg-amber-50 text-amber-700" },
  queue: { icon: Navigation, cls: "bg-emerald-50 text-emerald-700" },
  delay: { icon: Clock, cls: "bg-orange-50 text-orange-700" },
  waitlist: { icon: BellRing, cls: "bg-violet-50 text-violet-700" },
  feedback: { icon: MessageSquareHeart, cls: "bg-pink-50 text-pink-700" },
  info: { icon: Info, cls: "bg-slate-100 text-slate-600" },
};

export default function Inbox() {
  const s = useStore();
  const { t, loc } = useI18n();
  const mine = s.messages.filter((m) => m.patientId === s.meId).sort((a, b) => b.at - a.at);
  const unread = mine.filter((m) => !m.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t("nav.inbox")} subtitle={t("inbox.sub")} actions={<Btn size="sm" variant="ghost" disabled={!unread} onClick={() => s.markAllRead(s.meId)}>{t("inbox.markAll")}</Btn>} />
      {mine.length === 0 ? <Empty icon={BellRing} text={t("empty.none")} /> : (
        <ul className="space-y-2">
          {mine.map((m) => {
            const I = icons[m.kind];
            return (
              <li key={m.id}>
                <button onClick={() => s.markRead(m.id)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-start ring-1 ${m.read ? "bg-white ring-slate-200" : "bg-teal-50/60 ring-teal-200"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${I.cls}`}><I.icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block">{loc(m.text)}</span>
                    <span className="mt-1 block text-sm text-slate-400">{hhmm(m.at)}</span>
                  </span>
                  {!m.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
