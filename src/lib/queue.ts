import type { State, Ticket } from "./types";

/** Minutes of cleaning/transition time between two patients. */
export const BUFFER = 5;

export const svcMin = (s: State, t: Ticket) => s.services.find((x) => x.id === t.serviceId)?.minutes ?? 30;

const order = (a: Ticket, b: Ticket) => Number(b.emergency) - Number(a.emergency) || a.arrivedAt - b.arrivedAt;

export interface QRow {
  ticket: Ticket;
  /** People that will be seen before this ticket (including the one in the chair). */
  ahead: number;
  /** Estimated minutes until this ticket enters the chair. */
  waitMin: number;
}

export function doctorQueue(s: State, doctorId: string, now: number) {
  const active = s.tickets.filter((t) => t.doctorId === doctorId && (t.status === "waiting" || t.status === "in_chair"));
  const chair = active.find((t) => t.status === "in_chair");
  const waiting = active.filter((t) => t.status === "waiting").sort(order);

  let cursor = 0;
  if (chair) {
    const elapsed = (now - (chair.startedAt ?? now)) / 60000;
    cursor = Math.max(2, svcMin(s, chair) - elapsed);
  }
  cursor += s.delays[doctorId] ?? 0;

  const rows: QRow[] = waiting.map((ticket, i) => {
    const row = { ticket, ahead: i + (chair ? 1 : 0), waitMin: Math.max(0, Math.round(cursor)) };
    cursor += svcMin(s, ticket) + BUFFER;
    return row;
  });

  return {
    chair,
    rows,
    /** Wait for someone who arrives right now. */
    newArrivalWait: Math.max(0, Math.round(cursor)),
    people: active.length,
  };
}

export type Level = "quiet" | "busy" | "crowded";

export function clinicStatus(s: State, now: number) {
  const per = s.doctors.map((d) => ({ doctor: d, ...doctorQueue(s, d.id, now) }));
  const best = per.reduce((a, b) => (b.newArrivalWait < a.newArrivalWait ? b : a));
  const waiting = per.reduce((n, p) => n + p.rows.length, 0);
  const inChair = per.filter((p) => p.chair).length;
  const wait = best.newArrivalWait;
  const level: Level = wait <= 10 ? "quiet" : wait <= 30 ? "busy" : "crowded";
  return { per, best, waiting, inChair, people: waiting + inChair, wait, level };
}

export function activeTicketFor(s: State, patientId: string) {
  return s.tickets.find((t) => t.patientId === patientId && (t.status === "waiting" || t.status === "in_chair"));
}

export function rowFor(s: State, ticket: Ticket, now: number) {
  return doctorQueue(s, ticket.doctorId, now).rows.find((r) => r.ticket.id === ticket.id);
}

export const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
