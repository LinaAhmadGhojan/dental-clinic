"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dict } from "./dict";
import type { L10n } from "./types";

export type Lang = "en" | "ar";

interface I18n {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Pick the text for the active language from a bilingual value. */
  loc: (v: L10n) => string;
  /** Short date (always Latin digits so the UI looks consistent in Arabic too). */
  date: (iso: string) => string;
}

const Ctx = createContext<I18n | null>(null);
const KEY = "dentacare:lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Lang | null;
      if (saved === "ar" || saved === "en") setLangState(saved);
      else if (navigator.language.startsWith("ar")) setLangState("ar");
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);

  const value = useMemo<I18n>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t: (key, vars) => {
        const entry = dict[key];
        let s = entry ? entry[lang === "ar" ? 1 : 0] : key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
        return s;
      },
      loc: (v) => v[lang],
      date: (iso) =>
        new Date(iso + "T12:00:00").toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-GB", {
          weekday: "short", day: "numeric", month: "short",
        }),
    }),
    [lang, setLang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}
