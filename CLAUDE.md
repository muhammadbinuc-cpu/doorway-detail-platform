# CLAUDE.md — Doorway Detail SaaS CRM

> Agent instructions. Read fully before making changes.

---

## Project Overview

**Doorway Detail** is a SaaS CRM for an exterior cleaning business (pressure washing, window cleaning, gutter detailing) in Oakville, Ontario. Manages the full customer lifecycle: quote → scheduling → invoicing → Stripe payment.

**Live**: Deployed on Vercel  
**Contact**: 289-772-5757 | Doorwaydetail@gmail.com

---

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 16.1 (App Router)                       |
| UI         | React 19.2 + Tailwind CSS 4                     |
| Language   | TypeScript 5                                    |
| Database   | Firebase Firestore                              |
| Auth       | Firebase Auth (session cookies)                 |
| Payments   | Stripe Checkout                                 |
| Email      | Gmail SMTP (Nodemailer) + React Email templates |
| SMS        | Twilio                                          |
| Calendar   | Google Calendar API                             |
| Charts     | Recharts                                        |
| Validation | Zod 4                                           |
| Animations | Framer Motion                                   |
| Icons      | Lucide React                                    |
| Audit Logs | Supabase (optional)                             |
| Testing    | Jest + ts-jest                                  |

---

## Commands

```bash
npm run dev        # Dev server → http://localhost:3000
npm run build      # Production build (type-checks everything)
npm run lint       # ESLint
npm run test       # Jest (run this before committing)

firebase deploy --only firestore:rules   # Deploy Firestore security rules
```

---

## File Map

```
src/
├── app/
│   ├── layout.tsx               # Root layout — fonts (Playfair Display + DM Sans), env validation, SEO
│   ├── page.tsx                 # Landing page ("use client") — imports from landing-parts.tsx
│   ├── landing-parts.tsx        # ⭐ All landing page components + data:
│   │                            #   Exports: BrandMark, ServicesSection, FaqAccordion, WorkerTeamFull
│   │                            #   Data: trustChips, equipmentChips, processSteps, reassuranceItems, faqItems, fadeUp
│   │                            #   Characters: WorkerWindowCleaner, WorkerPressureWasher, WorkerLandscaper,
│   │                            #               WorkerGutterCleaner, WorkerTeamFull (inline SVG + Framer Motion)
│   ├── globals.css              # Tailwind import, font CSS vars, gold CSS var (#C9A227)
│   ├── not-found.tsx
│   ├── actions.ts               # ⭐ ALL server actions — every mutation lives here
│   │
│   ├── admin/
│   │   ├── layout.tsx           # Auth guard + <ConfirmProvider> (promise-based confirm dialog)
│   │   ├── page.tsx             # Dashboard: job cards (friendly status labels), KPIs, chart, line-items editor modal
│   │   ├── invoices/page.tsx    # Invoices list — overdue badges/KPI, Mark Paid (method), Resend, Remind
│   │   ├── schedule/page.tsx    # Month calendar of scheduled jobs (plain date math, no dep)
│   │   └── clients/
│   │       ├── page.tsx         # Client list
│   │       └── [id]/page.tsx    # Client detail + job history
│   │
│   ├── login/page.tsx
│   ├── quote/
│   │   ├── page.tsx             # Public quote form → submitQuote server action
│   │   ├── quote-options.ts     # serviceOptions array + buildServiceSummary() — edit here to add/rename services
│   │   └── quote-panels.tsx     # QuoteIntro and QuoteSuccess components
│   ├── invoice/[id]/page.tsx    # Public invoice (INVOICED/PAID status only)
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   │
│   └── api/
│       ├── auth/verify/route.ts  # Session cookie verification
│       └── webhooks/stripe/      # Stripe payment webhook → marks job PAID
│
├── components/
│   ├── admin/
│   │   └── AdminSidebar.tsx          # ⭐ Shared admin nav (active prop) — used by all /admin pages
│   ├── ui/
│   │   └── ConfirmDialog.tsx         # ConfirmProvider + useConfirm() — promise-based confirm (replaces window.confirm)
│   └── email/
│       ├── InvoiceEmail.tsx          # React Email — full breakdown (line items, subtotal/discount/tax/total, HST)
│       ├── InvoiceReminderEmail.tsx  # React Email — overdue payment reminder
│       └── QuoteConfirmationEmail.tsx # React Email — instant "we got your request" to new leads
│
└── lib/
    ├── key-utils.ts             # ⭐ sanitizeKey() — shared private key sanitizer
    ├── firebase.ts              # Firebase Client SDK (client components only)
    ├── firebase-admin.ts        # Firebase Admin SDK (server actions only)
    ├── google.ts                # Google Calendar — addToGoogleCalendar()
    ├── fsm_logic.ts             # ⭐ FSM — isValidTransition(), JOB_WORKFLOW
    ├── invoice.ts               # ⭐ computeInvoiceTotals() — SINGLE source of truth for invoice math + getDueDate()
    ├── business.ts              # BUSINESS consts (name/phone/HST), formatInvoiceNumber(), PAYMENT_TERMS_DAYS
    ├── job-status.ts            # STATUS_META — human labels + colors for job statuses (no raw enums in UI)
    ├── validation.ts            # Zod schemas + validateQuote/Job/Client/Booking/Id (Job update includes lineItems)
    ├── errors.ts                # AppError class + handleServerActionError()
    ├── rate-limit.ts            # In-memory rate limiting (quote: 5/15min, login: 5/5min)
    ├── env-validator.ts         # requireValidEnv() called at startup in layout.tsx
    └── services.ts              # ServiceLayer.logEvent() → Supabase audit (only thing here)

__tests__/
└── fsm.test.ts                  # 10 FSM transition tests
```

### Landing page section order (page.tsx)

1. Nav — Services · How It Works · Why Doorway (3 links only, no Join the Team)
2. Hero — headline + CTA + trust chips + WorkerTeamFull illustration
3. Equipment credibility strip — commercial-grade equipment chips
4. ServicesSection — interactive tab: click service → character animates
5. How It Works — 3-step process cards
6. "You're never left wondering" — text/arrival/invoice update cards
7. Why Doorway — dark section, reassuranceItems grid
8. Same-street discount — neighbour travel-fee-waiver callout
9. Return client perks — returnPerks 2×2 grid
10. Custom requests — open-ended CTA
11. FAQ — FaqAccordion (5 questions)
12. Contractors — hiring callout (not in nav)
13. Footer + mobile sticky CTA bar

---

## Job Workflow (FSM)

Defined in `src/lib/fsm_logic.ts`. **Never bypass `isValidTransition()`.**

```
LEAD_RECEIVED → SCHEDULED → COMPLETED → INVOICED → PAID
                                                  → UNPAID → PAID
LEAD_RECEIVED → LOST (terminal)
LEAD_RECEIVED → CANCELLED
SCHEDULED     → CANCELLED
CANCELLED     → SCHEDULED  (reschedule)

⚠️  Emergency override: any state → SCHEDULED always allowed (fsm_logic.ts:26)
    This is intentional for fixing stuck jobs. Do NOT remove it.
```

---

## Security Architecture

### Auth Flow

1. Login at `/login` via Firebase Auth (email/password)
2. Client sends ID token → `verifyFirebaseLogin` server action
3. Server sets `__session` cookie (httpOnly, 5-day expiry)
4. Middleware checks cookie on every `/admin/*` request
5. `admin/layout.tsx` re-verifies server-side as double check

### Data Access

- **Public**: GET jobs where status is `INVOICED`, `UNPAID`, or `PAID` only (UNPAID included so overdue customers — flagged by the reminder cron — can still load and pay their invoice; see `firestore.rules`)
- **Writes**: Server Actions via Firebase Admin SDK (bypasses Firestore rules)
- **Admin reads**: Client SDK with `onSnapshot` (Firestore rules enforce auth)

### Security modules

- `errors.ts` — never leaks internals; maps to user-safe messages
- `validation.ts` — strips HTML, validates all inputs at boundary
- `rate-limit.ts` — IP-based (in-memory, resets on cold start — known tradeoff)
- `env-validator.ts` — fails fast at startup if required vars missing
- `.keys/` — service account JSONs are gitignored here

---

## Coding Conventions

### Server Actions (actions.ts)

- Every admin action MUST start with `await requireAdmin()`
- Every doc ID MUST be run through `validateId()` before use
- Error pattern:
  ```typescript
  try {
    await requireAdmin();
    validateId(id);
    // business logic
  } catch (error) {
    return handleServerActionError(error, "actionName");
  }
  ```

### Firebase

- Client SDK (`@/lib/firebase`) — client components only
- Admin SDK (`@/lib/firebase-admin`) — server actions only. Never import in client components.

### Styling

- Tailwind CSS 4 — utility classes only
- **Color system (three surfaces only — do not add new backgrounds):**
  - Page base: `#FFFFFF` white — `<main>`, hero, nav
  - Card surface: `#F5F4F0` warm light gray — cards, chips, form fields, secondary sections
  - Dark: `#111111` — "Why Doorway" section + footer only
- **Gold:** Primary `#C9A227` (CTAs, fills, active states) · Dark accent `#6B5010` (labels, icons, secondary text)
- **CSS variable:** `--color-gold: #C9A227` defined in `globals.css`
- **Fonts:** `Playfair Display` (headings h1/h2/h3, variable `--font-display`) · `DM Sans` (body/UI, variable `--font-sans`) — imported in `layout.tsx`
- Rounded: `rounded-xl` or `rounded-2xl`
- Animations: Framer Motion

### Key sanitization

- Use `sanitizeKey()` from `@/lib/key-utils` for any private key/secret env var
- Do NOT inline `key.replace(/['"]/g, "").replace(/\\n/g, "\n")` — it already exists

### Invoices (single source of truth)

- **Never recompute invoice totals inline.** Use `computeInvoiceTotals(job)` from `@/lib/invoice` — used by the web invoice, the email, Stripe checkout, and the admin views. It normalizes `lineItems` (falls back to `service`+`price`), applies discount then tax, rounds to cents.
- `InvoiceEmail` props: `{ clientName, invoiceNumber, invoiceUrl, lineItems, subtotal, discount, taxRate, taxAmount, total, dueDate, business }`.
- Sequential numbers via `assignInvoiceNumber(jobRef)` in `actions.ts` — a Firestore transaction on `counters/invoices`. **Idempotent**: re-sending an invoiced job does NOT bump the number. Assigned on first `→ INVOICED` (both `emailInvoice` and a manual `updateJobStatus`).
- Business identity (name, address, phone, HST#) lives in `@/lib/business` `BUSINESS`.

### Getting paid + auto-chase

- **Manual payment** (e-transfer/cash): `markInvoicePaid(jobId, method)` action. Stripe payments flow through the webhook (`paymentMethod:'card'`).
- **Receipt email**: both payment paths call `sendPaymentReceipt(jobId)` from `src/lib/server/payment-receipt.ts` (server-only, non-blocking) → emails a paid-in-full receipt via `PaymentReceiptEmail`.
- **Overdue / reminders**: predicates `isOverdue(job, now)` and `isReminderDue(job, now)` in `@/lib/invoice` (gentle policy: remind once overdue, then every 3 days, max 3). **Unit-tested — change the policy there, not inline.**
- **Cron**: `vercel.json` runs `GET /api/cron/invoice-reminders` daily (14:00 UTC). It auto-flags overdue `INVOICED→UNPAID` and sends due reminders. Auth: requires `Authorization: Bearer $CRON_SECRET` (Vercel injects this) — **fails closed** (503) if `CRON_SECRET` unset, 401 on mismatch.
- ⚠️ **`"use server"` gotcha**: every export from `actions.ts` is a PUBLIC endpoint. The unauthenticated reminder body lives in `src/lib/server/invoice-reminder.ts` (`import 'server-only'`) so it's reachable only from the admin action (gated by `requireAdmin`) and the cron route (gated by `CRON_SECRET`) — never expose it as an action.

---

## Known Issues & Gotchas

1. **Rate limiting resets on cold start** — in-memory. Fine for now; upgrade to Redis/Firestore for scale.
2. **Geocoding defaults to mock** — `MOCK_GEOCODING=false` in env enables real Google Maps. Currently hardcodes Toronto coords.
3. **`services.ts` only has `logEvent`** — the rest was dead code and was removed. If Supabase isn't configured, logEvent silently no-ops.
4. **Admin page is dense but manageable (~190 lines).** If it grows, extract JobCard, KPI strip, RevenueChart, ScheduleModal, InvoiceSettingsModal. The inline `<aside>` sidebar is duplicated across `admin/page.tsx`, `admin/invoices/page.tsx`, and `admin/clients/page.tsx` — keep nav links in sync (candidate to extract into one `<AdminSidebar>`).
5. **Toasts + confirms** — admin uses `sonner` (`<Toaster>` in root `layout.tsx`). Success/error → `toast.success/error`. Destructive confirms → `useConfirm()` from `@/components/ui/ConfirmDialog` (provider in `admin/layout.tsx`). **Don't reintroduce `alert()`/`confirm()`.**
6. **Testimonials are placeholder** — `Testimonials` in `src/app/landing-conversion.tsx` renders a "coming soon" prompt while its `testimonials` array is empty. ⚠️ Fill with REAL reviews only — fake reviews violate Canada's Competition Act.
7. **Before/after gallery** — `BeforeAfterGallery` in `src/app/landing-conversion.tsx`. Fill each item's `before`/`after` image paths (in `/public`) to switch a tile from "photo coming soon" to an interactive drag-slider.
8. **`submitQuote` sends an instant customer confirmation** (email via `QuoteConfirmationEmail` + SMS) through `sendQuoteConfirmation()`. It's **non-blocking** — a missing Gmail/Twilio key or send failure is caught and logged, never failing lead capture. Keep it that way. (Email transport is `sendMail()` in `src/lib/server/mailer.ts` — Gmail SMTP; it renders the React Email template to HTML and returns `{ok,error}`. `emailInvoice` surfaces a `deliveryWarning` to the admin on failure instead of a false success, and attaches a PDF copy of the invoice via `src/lib/server/invoice-pdf.tsx`.)
9. **Hover states in page.tsx use inline `onMouseEnter/Leave`** — because Tailwind 4 doesn't support arbitrary `hover:bg-[#hex]` with dynamic values. If refactoring, consider extracting button variants.

---

## Environment Variables

### Required

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_BASE_URL
```

### Optional (features degrade gracefully without these)

```
GMAIL_USER                  # Active email sender — the Doorway Detail Gmail (doorwaydetail@gmail.com)
GMAIL_APP_PASSWORD          # Google App Password (NOT the account password; requires 2FA). Used by src/lib/server/mailer.ts (Gmail SMTP via Nodemailer)
RESEND_API_KEY              # Legacy — Resend is no longer wired up (kept for reference)
TWILIO_ACCOUNT_SID          # SMS notifications
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
GOOGLE_CALENDAR_ID          # Calendar sync on booking
NEXT_PUBLIC_SUPABASE_URL    # Audit logging
SUPABASE_SERVICE_ROLE_KEY
MOCK_GEOCODING              # Set to "false" for real Google Maps geocoding
NEXT_PUBLIC_BUSINESS_HST_NUMBER  # HST/GST number on invoices. MUST be NEXT_PUBLIC_ — the invoice page is a client component, so a server-only var won't render there (falls back to BUSINESS_HST_NUMBER for email-only contexts).
CRON_SECRET                 # Auth for the daily invoice-reminder cron (set in Vercel; route fails closed if unset)
```

---

## Firestore Schema

### `jobs`

```typescript
{
  clientId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  service: string;
  status: 'LEAD_RECEIVED' | 'SCHEDULED' | 'COMPLETED' | 'INVOICED' | 'PAID' | 'UNPAID' | 'LOST' | 'CANCELLED';
  price?: number;
  discount?: number;
  taxRate?: number;
  invoiceNotes?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number }[];  // optional; falls back to service+price
  invoiceNumber?: number;   // sequential, assigned (idempotent) on first → INVOICED
  invoicedAt?: Timestamp;   // when invoiceNumber was assigned; due date = +14 days
  paidAt?: Timestamp;       // set on payment (Stripe webhook or manual Mark Paid)
  paymentMethod?: 'etransfer' | 'cash' | 'card';   // 'card' = Stripe; others = manual
  amountPaid?: number;
  stripePaymentId?: string;
  reminderCount?: number;   // # of overdue reminders sent (cron caps at 3)
  lastReminderAt?: Timestamp;
  scheduledDate?: string;
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
}

// counters/invoices { current: number } — atomic sequential invoice numbering (seed 1000).
```

### `clients`

```typescript
{
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyNotes?: string;
  geolocation: { lat: number; lng: number };
  status: 'LEAD' | string;
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
}
```

---

## Routes

| Route                         | Auth        | Description                          |
| ----------------------------- | ----------- | ------------------------------------ |
| `/`                           | Public      | Landing page                         |
| `/quote`                      | Public      | Quote submission                     |
| `/login`                      | Public      | Admin login                          |
| `/admin`                      | Protected   | Job dashboard                        |
| `/admin/invoices`             | Protected   | Invoices list (INVOICED/UNPAID/PAID) |
| `/admin/schedule`             | Protected   | Month calendar of scheduled jobs     |
| `/admin/clients`              | Protected   | Client list                          |
| `/admin/clients/[id]`         | Protected   | Client detail                        |
| `/invoice/[id]`               | Semi-public | Invoice (INVOICED/PAID only)         |
| `/api/webhooks/stripe`        | Stripe      | Payment confirmation                 |
| `/api/cron/invoice-reminders` | CRON_SECRET | Daily auto-chase of overdue invoices |

---

## Testing

```bash
npm test                        # All tests
npm test -- --watch             # Watch mode
npm test -- fsm.test.ts         # Specific file
```

Tests live in `__tests__/`. Current coverage: `fsm.test.ts` (10 cases, full workflow + admin override).

---

## Deployment

Push to `main` → Vercel auto-deploys.

Pre-deploy checklist:

- `npm run build` clean
- `npm run test` passing
- All required env vars in Vercel dashboard
- Stripe webhook registered at `https://<domain>/api/webhooks/stripe`
- Firestore rules deployed via `firebase deploy --only firestore:rules`
