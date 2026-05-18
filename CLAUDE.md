# CLAUDE.md — Doorway Detail SaaS CRM

> Agent instructions. Read fully before making changes.

---

## Project Overview

**Doorway Detail** is a SaaS CRM for an exterior cleaning business (pressure washing, window cleaning, gutter detailing) in Oakville, Ontario. Manages the full customer lifecycle: quote → scheduling → invoicing → Stripe payment.

**Live**: Deployed on Vercel  
**Contact**: 289-772-5757 | Doorwaydetail@gmail.com

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1 (App Router) |
| UI | React 19.2 + Tailwind CSS 4 |
| Language | TypeScript 5 |
| Database | Firebase Firestore |
| Auth | Firebase Auth (session cookies) |
| Payments | Stripe Checkout |
| Email | Resend + React Email |
| SMS | Twilio |
| Calendar | Google Calendar API |
| Charts | Recharts |
| Validation | Zod 4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Audit Logs | Supabase (optional) |
| Testing | Jest + ts-jest |

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
│   ├── layout.tsx               # Root layout — runs env validation, fonts, SEO
│   ├── page.tsx                 # Landing page ("use client")
│   ├── globals.css
│   ├── not-found.tsx
│   ├── actions.ts               # ⭐ ALL server actions — every mutation lives here
│   │
│   ├── admin/
│   │   ├── layout.tsx           # Server component — Firebase session auth guard
│   │   ├── page.tsx             # Dashboard: job cards, KPIs, chart, modals (dense — refactor target)
│   │   └── clients/
│   │       ├── page.tsx         # Client list
│   │       └── [id]/page.tsx    # Client detail + job history
│   │
│   ├── login/page.tsx
│   ├── quote/page.tsx           # Public quote form → submitQuote server action
│   ├── invoice/[id]/page.tsx    # Public invoice (INVOICED/PAID status only)
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   │
│   └── api/
│       ├── auth/verify/route.ts  # Session cookie verification
│       ├── quotes/route.ts       # Legacy API route (unused — real flow is submitQuote action)
│       └── webhooks/stripe/      # Stripe payment webhook → marks job PAID
│
├── components/
│   └── email/
│       └── InvoiceEmail.tsx     # React Email template — accepts service, amount, clientName
│
└── lib/
    ├── key-utils.ts             # ⭐ sanitizeKey() — shared private key sanitizer
    ├── firebase.ts              # Firebase Client SDK (client components only)
    ├── firebase-admin.ts        # Firebase Admin SDK (server actions only)
    ├── google.ts                # Google Calendar — addToGoogleCalendar()
    ├── fsm_logic.ts             # ⭐ FSM — isValidTransition(), JOB_WORKFLOW
    ├── validation.ts            # Zod schemas + validateQuote/Job/Client/Booking/Id
    ├── errors.ts                # AppError class + handleServerActionError()
    ├── rate-limit.ts            # In-memory rate limiting (quote: 5/15min, login: 5/5min)
    ├── env-validator.ts         # requireValidEnv() called at startup in layout.tsx
    └── services.ts              # ServiceLayer.logEvent() → Supabase audit (only thing here)

__tests__/
└── fsm.test.ts                  # 10 FSM transition tests
```

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
- **Public**: GET jobs where status is `INVOICED` or `PAID` only
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
      return handleServerActionError(error, 'actionName');
  }
  ```

### Firebase
- Client SDK (`@/lib/firebase`) — client components only
- Admin SDK (`@/lib/firebase-admin`) — server actions only. Never import in client components.

### Styling
- Tailwind CSS 4 — utility classes only
- Color palette: Black `#000`, Gold `#D4AF37`, gray scale
- Rounded: `rounded-2xl` or `rounded-3xl`
- Animations: Framer Motion

### Key sanitization
- Use `sanitizeKey()` from `@/lib/key-utils` for any private key/secret env var
- Do NOT inline `key.replace(/['"]/g, "").replace(/\\n/g, "\n")` — it already exists

### InvoiceEmail
- Component is at `src/components/email/InvoiceEmail.tsx`
- Props: `{ clientName, service, amount, invoiceUrl, invoiceId }`
- Called in `emailInvoice()` server action — must pass `service: job.service`

---

## Known Issues & Gotchas

1. **Rate limiting resets on cold start** — in-memory. Fine for now; upgrade to Redis/Firestore for scale.
2. **Geocoding defaults to mock** — `MOCK_GEOCODING=false` in env enables real Google Maps. Currently hardcodes Toronto coords.
3. **`api/quotes/route.ts` is dead code** — uses client SDK with wrong field names (`customerName` vs `name`). Real flow is `submitQuote` server action. Don't use this route.
4. **`services.ts` only has `logEvent`** — the rest was dead code and was removed. If Supabase isn't configured, logEvent silently no-ops.
5. **Admin page is a single 160-line component** — major refactor target. Extract JobCard, KPI strip, RevenueChart, ScheduleModal, InvoiceSettingsModal.
6. **`alert()`/`confirm()` throughout admin** — replace with toast (sonner) when refactoring admin.
7. **`public/` is empty** — no favicon, no OG image for social previews.

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
RESEND_API_KEY              # Email invoices
TWILIO_ACCOUNT_SID          # SMS notifications
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
GOOGLE_CALENDAR_ID          # Calendar sync on booking
NEXT_PUBLIC_SUPABASE_URL    # Audit logging
SUPABASE_SERVICE_ROLE_KEY
MOCK_GEOCODING              # Set to "false" for real Google Maps geocoding
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
  scheduledDate?: string;
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
}
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

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/quote` | Public | Quote submission |
| `/login` | Public | Admin login |
| `/admin` | Protected | Job dashboard |
| `/admin/clients` | Protected | Client list |
| `/admin/clients/[id]` | Protected | Client detail |
| `/invoice/[id]` | Semi-public | Invoice (INVOICED/PAID only) |
| `/api/webhooks/stripe` | Stripe | Payment confirmation |

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
