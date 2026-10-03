import { isoDate } from "./seed";
import type { State } from "./types";

export const money = (n: number) => `$${Math.round(n * 100) / 100}`;

export const todayIso = () => isoDate(0);

export function lastVisit(s: State, patientId: string): string | null {
  const dates = [
    ...s.treatments.filter((t) => t.patientId === patientId && t.status === "done").map((t) => t.date),
    ...s.appointments.filter((a) => a.patientId === patientId && a.status === "done").map((a) => a.date),
  ].sort();
  return dates.at(-1) ?? null;
}

export const monthsSince = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  const n = new Date();
  return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
};

/** Patients who should be invited back for a routine check-up. */
export function recallDue(s: State) {
  return s.patients.filter((p) => {
    const last = lastVisit(s, p.id);
    const hasFuture = s.appointments.some((a) => a.patientId === p.id && a.status === "booked" && a.date >= todayIso());
    return last !== null && !hasFuture && monthsSince(last) >= p.recallMonths;
  });
}

export const balanceOf = (s: State, patientId: string) =>
  s.treatments.filter((t) => t.patientId === patientId && t.status === "done").reduce((n, t) => n + (t.price - t.paid), 0);

export const nextDays = (count: number) => Array.from({ length: count }, (_, i) => isoDate(i));
