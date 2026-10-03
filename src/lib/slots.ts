import { isoDate } from "./seed";
import type { State } from "./types";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMin = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export const OPEN = 9 * 60;
export const CLOSE = 17 * 60;
export const LUNCH: [number, number] = [13 * 60, 14 * 60];

/** The clinic is closed on Fridays. */
export const isClosedDay = (date: string) => new Date(date + "T12:00:00").getDay() === 5;

/** Free start times (every 30 minutes) for a doctor/service on a date. */
export function freeSlots(s: State, doctorId: string, date: string, serviceId: string, ignoreApptId?: string) {
  if (isClosedDay(date)) return [];
  const dur = s.services.find((x) => x.id === serviceId)?.minutes ?? 30;
  const busy = s.appointments
    .filter((a) => a.doctorId === doctorId && a.date === date && (a.status === "booked" || a.status === "arrived") && a.id !== ignoreApptId)
    .map((a) => {
      const start = toMin(a.time);
      const d = s.services.find((x) => x.id === a.serviceId)?.minutes ?? 30;
      return [start, start + d] as const;
    });

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = date === isoDate(0);

  const out: string[] = [];
  for (let t = OPEN; t + dur <= CLOSE; t += 30) {
    if (t < LUNCH[1] && t + dur > LUNCH[0]) continue;
    if (isToday && t <= nowMin) continue;
    if (busy.some(([a, b]) => t < b && t + dur > a)) continue;
    out.push(fromMin(t));
  }
  return out;
}
