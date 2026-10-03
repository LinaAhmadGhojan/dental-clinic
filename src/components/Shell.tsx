"use client";

import {
  Activity, BarChart3, CalendarDays, CalendarPlus, CreditCard, FolderHeart, LayoutDashboard, Languages, MoreHorizontal,
  Radio, RotateCcw, Settings, Stethoscope, Users, MessageCircle, UserRound, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const STAFF = [
  { href: "/", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/queue", key: "nav.queue", icon: Activity },
  { href: "/appointments", key: "nav.appointments", icon: CalendarDays },
  { href: "/patients", key: "nav.patients", icon: Users },
  { href: "/billing", key: "nav.billing", icon: CreditCard },
  { href: "/reports", key: "nav.reports", icon: BarChart3 },
  { href: "/settings", key: "nav.settings", icon: Settings },
];

const PATIENT = [
  { href: "/p", key: "nav.home", icon: LayoutDashboard },
  { href: "/p/book", key: "nav.book", icon: CalendarPlus },
  { href: "/live", key: "nav.live", icon: Radio },
  { href: "/p/records", key: "nav.records", icon: FolderHeart },
  { href: "/p/inbox", key: "nav.inbox", icon: MessageCircle },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, "") || "/";
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const { role, setRole, meId, setMe, patients, messages, toasts, reset } = useStore();
  const [more, setMore] = useState(false);

  const isPatientArea = path === "/p" || path.startsWith("/p/");
  const shared = path === "/live";

  useEffect(() => {
    if (role === "staff" && isPatientArea) router.replace("/");
    if (role === "patient" && !isPatientArea && !shared) router.replace("/p");
  }, [role, isPatientArea, shared, router]);

  // The waiting-room TV screen is full-screen and has no navigation.
  if (path === "/display") return <>{children}</>;

  const nav = role === "staff" ? STAFF : PATIENT;
  const unread = messages.filter((m) => !m.read && m.patientId === (role === "staff" ? null : meId)).length;
  const active = (href: string) => (href === "/" || href === "/p" ? path === href : path === href || path.startsWith(href + "/"));
  const wrongArea = (role === "staff" && isPatientArea) || (role === "patient" && !isPatientArea && !shared);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_100%_-10%,#ccfbf1_0%,transparent_60%),radial-gradient(900px_400px_at_-10%_0%,#e0f2fe_0%,transparent_55%)] bg-slate-50">
      <header className="no-print sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6">
          <Link href={role === "staff" ? "/" : "/p"} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-600/30">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:block">{t("brand")}</span>
          </Link>

          <nav className="ms-4 hidden items-center gap-1 xl:flex">
            {nav.map((l) => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active(l.href) ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100"
                }`}>
                <l.icon className="h-4 w-4" />
                {t(l.key)}
                {l.href === "/p/inbox" && unread > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{unread}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            {role === "patient" && (
              <select
                value={meId}
                onChange={(e) => setMe(e.target.value)}
                aria-label={t("shell.signedInAs")}
                className="max-w-32 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm sm:max-w-44 sm:text-sm"
              >
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-sm font-medium sm:text-sm">
              {(["staff", "patient"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 transition ${role === r ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}>
                  {r === "staff" ? <Stethoscope className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{t(r === "staff" ? "role.staff" : "role.patient")}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm"
              aria-label="Language">
              <Languages className="h-4 w-4" />
              {lang === "en" ? "العربية" : "English"}
            </button>
            <button onClick={reset} title={t("shell.reset")} aria-label={t("shell.reset")}
              className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:block">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 pb-28 pt-5 sm:px-6 xl:pb-10">{wrongArea ? null : children}</main>

      {/* Mobile bottom navigation */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {(role === "staff" ? nav.slice(0, 4) : nav).map((l) => (
            <Link key={l.href} href={l.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm font-medium ${active(l.href) ? "text-teal-600" : "text-slate-400"}`}>
              <l.icon className="h-6 w-6" />
              {t(l.key)}
              {l.href === "/p/inbox" && unread > 0 && (
                <span className="absolute end-1/4 top-1 rounded-full bg-red-500 px-1 text-xs font-bold text-white">{unread}</span>
              )}
            </Link>
          ))}
          {role === "staff" && (
            <button onClick={() => setMore(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm font-medium text-slate-400">
              <MoreHorizontal className="h-5 w-5" />
              {t("nav.more")}
            </button>
          )}
        </div>
      </nav>

      {more && (
        <div className="no-print fixed inset-0 z-40 bg-slate-900/50 xl:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">{t("nav.menu")}</span>
              <button onClick={() => setMore(false)} aria-label="Close"><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {nav.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMore(false)}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-sm font-medium ${active(l.href) ? "bg-teal-50 text-teal-700" : "bg-slate-50 text-slate-600"}`}>
                  <l.icon className="h-6 w-6" />
                  {t(l.key)}
                </Link>
              ))}
              <Link href="/display" onClick={() => setMore(false)} className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
                <Radio className="h-6 w-6" />
                {t("nav.tv")}
              </Link>
              <button onClick={() => { reset(); setMore(false); }} className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
                <RotateCcw className="h-6 w-6" />
                {t("shell.reset")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((x) => (
          <div key={x.id} className="pointer-events-auto rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-xl">
            {x.text}
          </div>
        ))}
      </div>
    </div>
  );
}
