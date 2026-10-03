"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doctorQueue } from "./queue";
import { isoDate, makeSeed } from "./seed";
import type {
  Appointment, ApptStatus, Feedback, L10n, Message, Patient, Prescription, Role, Service, State, ToothCondition,
  Treatment,
} from "./types";

const KEY = "dentacare:v3";
const uid = () => Math.random().toString(36).slice(2, 9);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  return makeSeed();
}

/** Re-renders every `ms` so wait times and clocks stay live without any user action. */
export function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export interface CheckInInput {
  patientId: string;
  doctorId: string;
  serviceId: string;
  apptId?: string;
  emergency?: boolean;
  onTheWay?: boolean;
}

interface Ctx extends State {
  ready: boolean;
  toasts: { id: string; text: string }[];
  toast: (text: string) => void;
  patient: (id: string) => Patient | undefined;
  setRole: (r: Role) => void;
  setMe: (id: string) => void;

  bookAppointment: (a: Omit<Appointment, "id" | "status">) => string;
  cancelAppointment: (id: string) => void;
  setApptStatus: (id: string, status: ApptStatus) => void;
  joinWaitlist: (patientId: string, serviceId: string, doctorId: string, date: string) => void;
  removeWaitlist: (id: string) => void;

  checkIn: (input: CheckInInput) => void;
  markArrived: (ticketId: string) => void;
  startTicket: (ticketId: string) => void;
  finishTicket: (ticketId: string, items: { serviceId: string; tooth: number | null }[], note: string) => void;
  leaveTicket: (ticketId: string) => void;
  toggleEmergency: (ticketId: string) => void;
  setDelay: (doctorId: string, minutes: number) => void;

  addPatient: (p: Omit<Patient, "id">) => string;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  setTooth: (patientId: string, tooth: number, c: ToothCondition) => void;
  addTreatment: (t: Omit<Treatment, "id" | "paid">) => void;
  setTreatmentStatus: (id: string, status: Treatment["status"]) => void;
  pay: (treatmentId: string, amount: number) => void;
  payAll: (patientId: string) => void;
  addPrescription: (p: Omit<Prescription, "id" | "date">) => void;
  addNote: (patientId: string, doctorId: string, text: string) => void;
  addFeedback: (f: Omit<Feedback, "id" | "date">) => void;

  markRead: (id: string) => void;
  markAllRead: (patientId: string | null) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  addService: (s: Omit<Service, "id">) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

function msg(patientId: string | null, kind: Message["kind"], text: L10n): Message {
  return { id: uid(), patientId, at: Date.now(), kind, text, read: false };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    setState(load());
    // Another tab changed the data (e.g. reception called the next patient) -> update live.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((fn: (s: State) => State) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const toast = useCallback((text: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo<Ctx | null>(() => {
    if (!state) return null;
    const docName = (s: State, id: string): L10n => s.doctors.find((d) => d.id === id)?.name ?? { en: "the doctor", ar: "الطبيب" };
    const svcName = (s: State, id: string): L10n => s.services.find((x) => x.id === id)?.name ?? { en: "visit", ar: "زيارة" };
    const patName = (s: State, id: string) => s.patients.find((p) => p.id === id)?.name ?? "";

    /** Tell the next waiting patient of a doctor that they are almost up. */
    const notifyNext = (s: State, doctorId: string): Message[] => {
      const { rows } = doctorQueue(s, doctorId, Date.now());
      const first = rows[0];
      if (!first) return [];
      return [
        msg(first.ticket.patientId, "queue", {
          en: first.ticket.onTheWay
            ? "You are next in line. Please head to the clinic now!"
            : "You are next in line. Please get ready; the doctor will call you shortly.",
          ar: first.ticket.onTheWay
            ? "دورك هو التالي. يرجى التوجّه إلى العيادة الآن!"
            : "دورك هو التالي. يرجى الاستعداد، سيناديك الطبيب بعد قليل.",
        }),
      ];
    };

    const api: Ctx = {
      ...state,
      ready: true,
      toasts,
      toast,
      patient: (id) => state.patients.find((p) => p.id === id),
      setRole: (role) => commit((s) => ({ ...s, role })),
      setMe: (meId) => commit((s) => ({ ...s, meId })),

      bookAppointment: (a) => {
        const id = uid();
        commit((s) => ({
          ...s,
          appointments: [...s.appointments, { ...a, id, status: "booked" }],
          messages: [
            msg(a.patientId, "booking", {
              en: `Your appointment (${svcName(s, a.serviceId).en}) on ${a.date} at ${a.time} with ${docName(s, a.doctorId).en} is confirmed.`,
              ar: `تم تأكيد موعدك (${svcName(s, a.serviceId).ar}) بتاريخ ${a.date} الساعة ${a.time} مع ${docName(s, a.doctorId).ar}.`,
            }),
            msg(null, "info", {
              en: `New booking: ${patName(s, a.patientId)}, ${svcName(s, a.serviceId).en}, ${a.date} ${a.time}.`,
              ar: `حجز جديد: ${patName(s, a.patientId)}، ${svcName(s, a.serviceId).ar}، ${a.date} ${a.time}.`,
            }),
            ...s.messages,
          ],
        }));
        return id;
      },
      cancelAppointment: (id) =>
        commit((s) => {
          const a = s.appointments.find((x) => x.id === id);
          if (!a) return s;
          // A freed slot is offered to the first matching patient on the waiting list.
          const w = s.waitlist.find((x) => x.date === a.date && (x.doctorId === "any" || x.doctorId === a.doctorId));
          const extra = w
            ? [
                msg(w.patientId, "waitlist", {
                  en: `Good news! A slot opened on ${a.date} at ${a.time} with ${docName(s, a.doctorId).en}. Book it now before it is gone.`,
                  ar: `خبر سار! توفّر موعد بتاريخ ${a.date} الساعة ${a.time} مع ${docName(s, a.doctorId).ar}. احجزه الآن قبل أن يُحجز.`,
                }),
              ]
            : [];
          return {
            ...s,
            appointments: s.appointments.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)),
            waitlist: w ? s.waitlist.filter((x) => x.id !== w.id) : s.waitlist,
            messages: [
              ...extra,
              msg(null, "info", {
                en: `Appointment cancelled: ${patName(s, a.patientId)} (${a.date} ${a.time}).${w ? " Waiting-list patient notified." : ""}`,
                ar: `تم إلغاء موعد: ${patName(s, a.patientId)} (${a.date} ${a.time}).${w ? " تم إشعار مريض من قائمة الانتظار." : ""}`,
              }),
              ...s.messages,
            ],
          };
        }),
      setApptStatus: (id, status) =>
        commit((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)) })),
      joinWaitlist: (patientId, serviceId, doctorId, date) =>
        commit((s) => ({
          ...s,
          waitlist: [...s.waitlist, { id: uid(), patientId, serviceId, doctorId, date, createdAt: Date.now() }],
        })),
      removeWaitlist: (id) => commit((s) => ({ ...s, waitlist: s.waitlist.filter((w) => w.id !== id) })),

      checkIn: (input) => {
        commit((s) => {
          const existing = s.tickets.find((t) => t.patientId === input.patientId && (t.status === "waiting" || t.status === "in_chair"));
          if (existing) return s;
          const ticketId = uid();
          const number = s.nextTicket;
          const ticket = {
            id: ticketId, number, patientId: input.patientId, doctorId: input.doctorId, serviceId: input.serviceId,
            apptId: input.apptId, arrivedAt: Date.now(), status: "waiting" as const, emergency: !!input.emergency,
            kind: input.apptId ? ("appointment" as const) : ("walkin" as const), onTheWay: !!input.onTheWay,
          };
          const next: State = {
            ...s,
            nextTicket: number + 1,
            tickets: [...s.tickets, ticket],
            appointments: s.appointments.map((a) => (a.id === input.apptId ? { ...a, status: "arrived" } : a)),
          };
          const row = doctorQueue(next, input.doctorId, Date.now()).rows.find((r) => r.ticket.id === ticketId);
          return {
            ...next,
            messages: [
              msg(input.patientId, "queue", {
                en: `You are #${number} in the queue. People ahead: ${row?.ahead ?? 0}. Estimated wait: ~${row?.waitMin ?? 0} min.`,
                ar: `رقمك في الدور #${number}. عدد الأشخاص قبلك: ${row?.ahead ?? 0}. الانتظار المتوقع: ~${row?.waitMin ?? 0} دقيقة.`,
              }),
              ...s.messages,
            ],
          };
        });
      },
      markArrived: (ticketId) =>
        commit((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, onTheWay: false } : t)) })),
      startTicket: (ticketId) =>
        commit((s) => {
          const t = s.tickets.find((x) => x.id === ticketId);
          if (!t || t.status !== "waiting") return s;
          if (s.tickets.some((x) => x.doctorId === t.doctorId && x.status === "in_chair")) return s;
          const next: State = {
            ...s,
            tickets: s.tickets.map((x) => (x.id === ticketId ? { ...x, status: "in_chair", startedAt: Date.now(), onTheWay: false } : x)),
          };
          return { ...next, messages: [...notifyNext(next, t.doctorId), ...s.messages] };
        }),
      finishTicket: (ticketId, items, note) =>
        commit((s) => {
          const t = s.tickets.find((x) => x.id === ticketId);
          if (!t) return s;
          const date = isoDate(0);
          const treatments: Treatment[] = items.map((it) => ({
            id: uid(), patientId: t.patientId, doctorId: t.doctorId, tooth: it.tooth, serviceId: it.serviceId,
            price: s.services.find((x) => x.id === it.serviceId)?.price ?? 0, paid: 0, date, status: "done",
          }));
          const next: State = {
            ...s,
            tickets: s.tickets.map((x) => (x.id === ticketId ? { ...x, status: "done", finishedAt: Date.now() } : x)),
            appointments: s.appointments.map((a) => (a.id === t.apptId ? { ...a, status: "done" } : a)),
            treatments: [...treatments, ...s.treatments],
            notes: note.trim() ? [{ id: uid(), patientId: t.patientId, doctorId: t.doctorId, date, text: note.trim() }, ...s.notes] : s.notes,
          };
          return {
            ...next,
            messages: [
              msg(t.patientId, "feedback", {
                en: "Thank you for visiting! How was your experience? Rate your visit from your records page.",
                ar: "شكراً لزيارتك! كيف كانت تجربتك؟ قيّم زيارتك من صفحة سجلّك.",
              }),
              ...notifyNext(next, t.doctorId),
              ...s.messages,
            ],
          };
        }),
      leaveTicket: (ticketId) =>
        commit((s) => {
          const t = s.tickets.find((x) => x.id === ticketId);
          if (!t) return s;
          return {
            ...s,
            tickets: s.tickets.map((x) => (x.id === ticketId ? { ...x, status: "left", finishedAt: Date.now() } : x)),
            appointments: s.appointments.map((a) => (a.id === t.apptId ? { ...a, status: "no_show" } : a)),
          };
        }),
      toggleEmergency: (ticketId) =>
        commit((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, emergency: !t.emergency } : t)) })),
      setDelay: (doctorId, minutes) =>
        commit((s) => {
          const waiting = s.tickets.filter((t) => t.doctorId === doctorId && t.status === "waiting");
          const alerts = minutes
            ? waiting.map((t) =>
                msg(t.patientId, "delay", {
                  en: `${docName(s, doctorId).en} is running about ${minutes} min late. Your estimated wait has been updated.`,
                  ar: `${docName(s, doctorId).ar} متأخر حوالي ${minutes} دقيقة. تم تحديث وقت الانتظار المتوقع.`,
                }),
              )
            : [];
          return { ...s, delays: { ...s.delays, [doctorId]: minutes }, messages: [...alerts, ...s.messages] };
        }),

      addPatient: (p) => {
        const id = uid();
        commit((s) => ({ ...s, patients: [...s.patients, { ...p, id }], teeth: { ...s.teeth, [id]: {} } }));
        return id;
      },
      updatePatient: (id, patch) =>
        commit((s) => ({ ...s, patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setTooth: (patientId, tooth, c) =>
        commit((s) => ({ ...s, teeth: { ...s.teeth, [patientId]: { ...s.teeth[patientId], [tooth]: c } } })),
      addTreatment: (t) => commit((s) => ({ ...s, treatments: [{ ...t, id: uid(), paid: 0 }, ...s.treatments] })),
      setTreatmentStatus: (id, status) =>
        commit((s) => ({ ...s, treatments: s.treatments.map((t) => (t.id === id ? { ...t, status } : t)) })),
      pay: (id, amount) =>
        commit((s) => ({
          ...s,
          treatments: s.treatments.map((t) => (t.id === id ? { ...t, paid: Math.min(t.price, t.paid + amount) } : t)),
        })),
      payAll: (patientId) =>
        commit((s) => ({
          ...s,
          treatments: s.treatments.map((t) => (t.patientId === patientId && t.status === "done" ? { ...t, paid: t.price } : t)),
        })),
      addPrescription: (p) =>
        commit((s) => ({ ...s, prescriptions: [{ ...p, id: uid(), date: isoDate(0) }, ...s.prescriptions] })),
      addNote: (patientId, doctorId, text) =>
        commit((s) => ({ ...s, notes: [{ id: uid(), patientId, doctorId, text, date: isoDate(0) }, ...s.notes] })),
      addFeedback: (f) =>
        commit((s) => ({ ...s, feedback: [{ ...f, id: uid(), date: isoDate(0) }, ...s.feedback] })),

      markRead: (id) => commit((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)) })),
      markAllRead: (patientId) =>
        commit((s) => ({ ...s, messages: s.messages.map((m) => (m.patientId === patientId ? { ...m, read: true } : m)) })),
      updateService: (id, patch) =>
        commit((s) => ({ ...s, services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      addService: (sv) => commit((s) => ({ ...s, services: [...s.services, { ...sv, id: uid() }] })),
      reset: () => commit(() => makeSeed()),
    };
    return api;
  }, [state, toasts, toast, commit]);

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
