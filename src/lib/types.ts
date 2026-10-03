export interface L10n {
  en: string;
  ar: string;
}

export type ToothCondition = "healthy" | "cavity" | "filled" | "crown" | "rootcanal" | "missing";

export interface Doctor {
  id: string;
  name: L10n;
  specialty: L10n;
  color: string;
}

export interface Service {
  id: string;
  name: L10n;
  minutes: number;
  price: number;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  allergies: string;
  conditions: string;
  notes: string;
  /** Months until the clinic reminds the patient to come back for a check-up. */
  recallMonths: number;
}

export type ApptStatus = "booked" | "arrived" | "done" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: ApptStatus;
  source: "patient" | "staff";
}

export type QStatus = "waiting" | "in_chair" | "done" | "left";

export interface Ticket {
  id: string;
  number: number;
  patientId: string;
  doctorId: string;
  serviceId: string;
  apptId?: string;
  arrivedAt: number;
  startedAt?: number;
  finishedAt?: number;
  status: QStatus;
  emergency: boolean;
  kind: "appointment" | "walkin";
  /** Joined the virtual queue from home and has not reached the clinic yet. */
  onTheWay: boolean;
}

export interface Treatment {
  id: string;
  patientId: string;
  doctorId: string;
  tooth: number | null;
  serviceId: string;
  price: number;
  paid: number;
  date: string;
  status: "planned" | "done";
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  items: { drug: string; dose: string; days: number }[];
}

export interface VisitNote {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  text: string;
}

export interface Message {
  id: string;
  /** null = message for the clinic staff */
  patientId: string | null;
  at: number;
  text: L10n;
  read: boolean;
  kind: "booking" | "reminder" | "queue" | "delay" | "waitlist" | "feedback" | "info";
}

export interface WaitlistItem {
  id: string;
  patientId: string;
  serviceId: string;
  doctorId: string; // "any" or a doctor id
  date: string;
  createdAt: number;
}

export interface Feedback {
  id: string;
  patientId: string;
  rating: number;
  comment: string;
  date: string;
}

export type Role = "staff" | "patient";

export interface State {
  doctors: Doctor[];
  services: Service[];
  patients: Patient[];
  appointments: Appointment[];
  tickets: Ticket[];
  treatments: Treatment[];
  teeth: Record<string, Record<number, ToothCondition>>;
  prescriptions: Prescription[];
  notes: VisitNote[];
  messages: Message[];
  waitlist: WaitlistItem[];
  feedback: Feedback[];
  /** Minutes the doctor is running late, announced to waiting patients. */
  delays: Record<string, number>;
  nextTicket: number;
  role: Role;
  meId: string;
}
