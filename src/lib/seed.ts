import type { State } from "./types";

export const isoDate = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Demo data is generated relative to "now" so the queue always looks alive. */
export function makeSeed(): State {
  const now = Date.now();
  const ago = (min: number) => now - min * 60000;

  return {
    role: "staff",
    meId: "p6",
    nextTicket: 5,
    delays: { dr1: 0 },
    doctors: [
      { id: "dr1", name: { en: "Dr. Ahmad Nasser", ar: "د. أحمد ناصر" }, specialty: { en: "General, cosmetic & root canal dentistry", ar: "طب الأسنان العام والتجميلي وعلاج الجذور" }, color: "#0d9488" },
    ],
    services: [
      { id: "s1", name: { en: "Check-up & consultation", ar: "فحص واستشارة" }, minutes: 20, price: 25 },
      { id: "s2", name: { en: "Scaling & polishing", ar: "تنظيف وتلميع" }, minutes: 30, price: 45 },
      { id: "s3", name: { en: "Composite filling", ar: "حشوة تجميلية" }, minutes: 40, price: 80 },
      { id: "s4", name: { en: "Root canal treatment", ar: "علاج عصب" }, minutes: 60, price: 220 },
      { id: "s5", name: { en: "Tooth extraction", ar: "خلع سن" }, minutes: 30, price: 60 },
      { id: "s6", name: { en: "Crown", ar: "تاج (كراون)" }, minutes: 60, price: 300 },
      { id: "s7", name: { en: "Teeth whitening", ar: "تبييض الأسنان" }, minutes: 45, price: 150 },
      { id: "s8", name: { en: "Braces adjustment", ar: "ضبط تقويم" }, minutes: 20, price: 50 },
      { id: "s9", name: { en: "Emergency visit", ar: "زيارة طارئة" }, minutes: 20, price: 40 },
    ],
    patients: [
      { id: "p1", name: "Sara Haddad", phone: "0791 234 567", age: 29, allergies: "Penicillin", conditions: "", notes: "Prefers morning visits.", recallMonths: 6 },
      { id: "p2", name: "عمر خليل", phone: "0782 111 902", age: 41, allergies: "", conditions: "Diabetes (type 2)", notes: "Anxious about injections.", recallMonths: 6 },
      { id: "p3", name: "Layla Nasser", phone: "0775 880 345", age: 12, allergies: "", conditions: "", notes: "Orthodontic patient.", recallMonths: 3 },
      { id: "p4", name: "يزن عزيز", phone: "0799 600 120", age: 35, allergies: "", conditions: "", notes: "", recallMonths: 6 },
      { id: "p5", name: "Rania Obeid", phone: "0788 450 011", age: 24, allergies: "Latex", conditions: "", notes: "", recallMonths: 6 },
      { id: "p6", name: "خالد منصور", phone: "0777 321 654", age: 52, allergies: "", conditions: "High blood pressure", notes: "", recallMonths: 6 },
      { id: "p7", name: "Mona Saleh", phone: "0795 998 222", age: 31, allergies: "", conditions: "Pregnant (2nd trimester)", notes: "Avoid X-rays.", recallMonths: 6 },
      { id: "p8", name: "هديل أبو زيد", phone: "0786 767 400", age: 19, allergies: "", conditions: "", notes: "", recallMonths: 12 },
    ],
    appointments: [
      { id: "a3", patientId: "p3", doctorId: "dr1", serviceId: "s8", date: isoDate(0), time: "09:00", status: "done", source: "staff" },
      { id: "a1", patientId: "p1", doctorId: "dr1", serviceId: "s3", date: isoDate(0), time: "09:30", status: "arrived", source: "patient" },
      { id: "a2", patientId: "p2", doctorId: "dr1", serviceId: "s1", date: isoDate(0), time: "10:15", status: "booked", source: "staff" },
      { id: "a4", patientId: "p4", doctorId: "dr1", serviceId: "s2", date: isoDate(0), time: "11:00", status: "done", source: "patient" },
      { id: "a5", patientId: "p5", doctorId: "dr1", serviceId: "s8", date: isoDate(0), time: "11:30", status: "booked", source: "patient" },
      { id: "a6", patientId: "p6", doctorId: "dr1", serviceId: "s1", date: isoDate(0), time: "15:00", status: "booked", source: "patient" },
      { id: "a7", patientId: "p7", doctorId: "dr1", serviceId: "s6", date: isoDate(1), time: "10:00", status: "booked", source: "patient" },
      { id: "a8", patientId: "p1", doctorId: "dr1", serviceId: "s1", date: isoDate(3), time: "09:00", status: "booked", source: "patient" },
      { id: "a9", patientId: "p8", doctorId: "dr1", serviceId: "s7", date: isoDate(1), time: "14:00", status: "booked", source: "staff" },
    ],
    tickets: [
      { id: "t0", number: 1, patientId: "p3", doctorId: "dr1", serviceId: "s8", apptId: "a3", arrivedAt: ago(80), startedAt: ago(70), finishedAt: ago(50), status: "done", emergency: false, kind: "appointment", onTheWay: false },
      { id: "t4", number: 2, patientId: "p4", doctorId: "dr1", serviceId: "s2", apptId: "a4", arrivedAt: ago(60), startedAt: ago(48), finishedAt: ago(20), status: "done", emergency: false, kind: "appointment", onTheWay: false },
      { id: "t1", number: 3, patientId: "p1", doctorId: "dr1", serviceId: "s3", apptId: "a1", arrivedAt: ago(35), startedAt: ago(25), status: "in_chair", emergency: false, kind: "appointment", onTheWay: false },
      { id: "t3", number: 4, patientId: "p8", doctorId: "dr1", serviceId: "s9", arrivedAt: ago(6), status: "waiting", emergency: true, kind: "walkin", onTheWay: false },
    ],
    treatments: [
      { id: "tr1", patientId: "p1", doctorId: "dr1", tooth: 14, serviceId: "s3", price: 80, paid: 80, date: isoDate(-60), status: "done" },
      { id: "tr2", patientId: "p1", doctorId: "dr1", tooth: 26, serviceId: "s3", price: 80, paid: 40, date: isoDate(-14), status: "done" },
      { id: "tr3", patientId: "p2", doctorId: "dr1", tooth: 36, serviceId: "s4", price: 220, paid: 100, date: isoDate(-7), status: "done" },
      { id: "tr4", patientId: "p2", doctorId: "dr1", tooth: 36, serviceId: "s6", price: 300, paid: 0, date: isoDate(0), status: "planned" },
      { id: "tr5", patientId: "p4", doctorId: "dr1", tooth: null, serviceId: "s2", price: 45, paid: 45, date: isoDate(-30), status: "done" },
      { id: "tr6", patientId: "p3", doctorId: "dr1", tooth: null, serviceId: "s8", price: 50, paid: 0, date: isoDate(0), status: "done" },
      { id: "tr7", patientId: "p7", doctorId: "dr1", tooth: 46, serviceId: "s6", price: 300, paid: 0, date: isoDate(1), status: "planned" },
      { id: "tr8", patientId: "p6", doctorId: "dr1", tooth: 18, serviceId: "s5", price: 60, paid: 60, date: isoDate(-90), status: "done" },
    ],
    teeth: {
      p1: { 26: "filled", 14: "filled", 18: "missing", 47: "cavity" },
      p2: { 36: "rootcanal", 46: "crown", 28: "missing", 38: "missing" },
      p3: {},
      p4: { 11: "crown", 47: "cavity" },
      p5: {},
      p6: { 18: "missing", 16: "cavity" },
      p7: { 46: "cavity" },
      p8: { 21: "cavity" },
    },
    prescriptions: [
      { id: "rx1", patientId: "p2", doctorId: "dr1", date: isoDate(-7), items: [{ drug: "Amoxicillin 500mg", dose: "1 capsule every 8 hours", days: 5 }, { drug: "Ibuprofen 400mg", dose: "1 tablet when needed", days: 3 }] },
    ],
    notes: [
      { id: "n1", patientId: "p2", doctorId: "dr1", date: isoDate(-7), text: "Root canal started on 36. Temporary filling placed. Patient tolerated well; crown recommended after healing." },
      { id: "n2", patientId: "p1", doctorId: "dr1", date: isoDate(-14), text: "Composite filling on 26. Advised to avoid very hot or cold drinks for 24h." },
    ],
    messages: [
      { id: "m1", patientId: "p1", at: ago(300), kind: "reminder", read: false, text: { en: "Reminder: you have an appointment today at 09:30 with Dr. Ahmad Nasser.", ar: "تذكير: لديك موعد اليوم الساعة 09:30 مع د. أحمد ناصر." } },
      { id: "m2", patientId: "p1", at: ago(1500), kind: "booking", read: true, text: { en: "Your appointment on " + isoDate(3) + " at 09:00 is confirmed.", ar: "تم تأكيد موعدك بتاريخ " + isoDate(3) + " الساعة 09:00." } },
      { id: "m3", patientId: null, at: ago(40), kind: "info", read: false, text: { en: "New online booking: Mona Saleh, Crown, tomorrow 10:00.", ar: "حجز جديد عبر الإنترنت: Mona Saleh، تاج، غداً 10:00." } },
      { id: "m4", patientId: null, at: ago(120), kind: "info", read: false, text: { en: "Recall due: 3 patients have not visited in 6+ months.", ar: "تذكير دوري: 3 مرضى لم يزوروا العيادة منذ أكثر من 6 أشهر." } },
    ],
    waitlist: [
      { id: "w1", patientId: "p5", serviceId: "s2", doctorId: "any", date: isoDate(1), createdAt: ago(600) },
    ],
    feedback: [
      { id: "f1", patientId: "p4", rating: 5, comment: "Very clean clinic and no waiting. Thank you!", date: isoDate(-30) },
      { id: "f2", patientId: "p6", rating: 4, comment: "ممتاز، بس تأخرت شوي بالدور.", date: isoDate(-90) },
    ],
  };
}
