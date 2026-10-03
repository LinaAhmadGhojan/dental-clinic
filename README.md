# DentaCare: Smart Dental Clinic Management

A complete clinic system (staff app + patient app) in **Arabic and English** (full RTL), responsive on phone and laptop.

## The problem it solves: waiting

- **Live clinic status** (`/live`, public): how many people are in the clinic and how long a new arrival would wait. Patients check it *before leaving home*.
- **Virtual queue**: join from home; the app says "leave in 12 min" using the live queue and the patient's travel time.
- **Waiting-room TV** (`/display`): now serving / next up, bilingual.
- **Honest wait times**: estimates come from each procedure's duration, the patient currently in the chair, emergencies and a "doctor is running late" button that notifies everyone waiting.
- **Smart waiting list**: when an appointment is cancelled, the first matching patient is notified.

## Clinic side

Dashboard, live queue (call next, emergency priority, finish visit → invoice), day calendar per doctor with double-booking protection, patient files (medical alerts, interactive odontogram, treatment plans with estimates, prescriptions, visit notes), billing with printable receipts, reports (revenue, visits, no-show rate, average wait, ratings, top procedures), settings (services, prices, durations) and recall reminders.

## Patient side

Home with live tracker, 3-step online booking, upcoming appointments, messages inbox (booking, reminders, "you're next", delays), records (chart, plan, balance, prescriptions, doctor's notes), pay online (demo) and rate the visit.

## Try the live effect

Open the app in two browser tabs: use **Clinic → Live queue** in one and **Patient → Live status** in the other. Calling the next patient or marking the doctor late updates the other tab instantly.

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS · lucide-react · React context store persisted in `localStorage` (cross-tab sync with the `storage` event). Demo data is generated relative to the current time; **Reset demo data** restores it.

## Run

```bash
npm install
npm run dev
```

## Deploy (static)

```bash
NEXT_PUBLIC_BASE_PATH=/dental-clinic npm run build   # upload ./out
```

## Production roadmap

Replace the local store with PostgreSQL + Prisma and real auth, send real SMS/WhatsApp (Twilio / WhatsApp Cloud API), WebSockets or SSE for the queue, Stripe for online payments, and tests.
