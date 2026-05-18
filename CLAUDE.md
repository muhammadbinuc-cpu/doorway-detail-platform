# CLAUDE.md — Doorway Detail SaaS CRM Platform

> **Instructions for Claude Code agents working on this codebase.**
> Read this file in full before making any changes.

---

## 📋 Project Overview

**Doorway Detail** is a SaaS CRM for an exterior cleaning business (pressure washing, window cleaning, gutter detailing) in Oakville, Ontario. It manages the full customer lifecycle from quote submission to payment collection.

**Live URL**: Deployed on Vercel
**Business Contact**: 289-772-5757 | Doorwaydetail@gmail.com

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1 |
| UI | React | 19.2 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | Firebase Firestore | — |
| Auth | Firebase Authentication (session cookies) | — |
| Payments | Stripe Checkout | — |
| Email | Resend + React Email | — |
| SMS | Twilio | — |
| Calendar | Google Calendar API | — |
| Charts | Recharts | — |
| Validation | Zod | 4.x |
| Animations | Framer Motion | — |
| Icons | Lucide React | — |
| Audit Logs | Supabase (optional) | — |
| Testing | Jest + ts-jest | — |

---

## 🚀 Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build (catches type errors)
npm run lint         # ESLint check
npm run test         # Run Jest tests

# Firebase
firebase deploy --only firestore:rules    # Deploy Firestore security rules
```

---

## 📁 Project Structure

```
doorway-detail/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout — runs env validation, sets fonts/SEO
│   │   ├── page.tsx               # Landing page (public, "use client")
│   │   ├── actions.ts             # ⭐ ALL Server Actions (core business logic)
│   │   ├── globals.css            # Tailwind CSS base
│   │   ├── not-found.tsx          # 404 page
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Server-side auth guard (Firebase session cookie)
│   │   │   ├── page.tsx           # Admin dashboard (jobs, KPIs, charts)
│   │   │   └── clients/
│   │   │       ├── page.tsx       # Client list
│   │   │       └── [id]/page.tsx  # Client detail page
│   │   │
│   │   ├── login/page.tsx         # Firebase email/password login
│   │   ├── quote/page.tsx         # Public quote form
│   │   ├── invoice/[id]/page.tsx  # Dynamic invoice (public for INVOICED/PAID)
│   │   ├── privacy/page.tsx       # Privacy policy
│   │   ├── terms/page.tsx         # Terms of service
│   │   │
│   │   └── api/
│   │       ├── auth/verify/       # Session verification (used by middleware)
│   │       ├── quotes/route.ts    # Quote submission API
│   │       └── webhooks/stripe/   # Stripe payment webhook
│   │
│   ├── components/
│   │   ├── QuoteModal.tsx         # Quote form modal component
│   │   └── email/
│   │       └── InvoiceEmail.tsx   # React Email template for invoices
│   │
│   ├── lib/
│   │   ├── firebase.ts           # Firebase Client SDK (singleton, client-safe)
│   │   ├── firebase-admin.ts     # Firebase Admin SDK (server-only)
│   │   ├── google.ts             # Google Calendar integration
│   │   ├── fsm_logic.ts          # ⭐ Finite State Machine — job status transitions
│   │   ├── validation.ts         # Zod schemas for all input validation
│   │   ├── errors.ts             # AppError class + error handling
│   │   ├── rate-limit.ts         # In-memory rate limiting
│   │   ├── env-validator.ts      # Startup env var validation
│   │   ├── services.ts           # Service layer (Calendar, SMS, Supabase)
│   │   └── safety.ts             # PII redaction + agent output validation
│   │
│   └── middleware.ts              # Edge middleware — protects /admin/* routes
│
├── __tests__/
│   └── fsm.test.ts               # FSM unit tests
├── firestore.rules                # Firestore security rules
└── .env.local                     # Environment variables (NEVER commit)
```

---

## 🔄 Job Workflow (Finite State Machine)

The core business logic uses a strict FSM defined in `src/lib/fsm_logic.ts`:

```
LEAD_RECEIVED → SCHEDULED → COMPLETED → INVOICED → PAID
                                                  → UNPAID → PAID
LEAD_RECEIVED → LOST (terminal)
LEAD_RECEIVED → CANCELLED → SCHEDULED (reschedule)
SCHEDULED → CANCELLED
```

**CRITICAL**: All status transitions MUST go through `isValidTransition()` from `fsm_logic.ts`. The `JOB_WORKFLOW` object defines allowed transitions. Never bypass this.

---

## 🔒 Security Architecture

### Authentication Flow
1. User logs in via Firebase Auth (email/password) at `/login`
2. Client sends ID token to `verifyFirebaseLogin` server action
3. Server creates a session cookie (`__session`, httpOnly, 5-day expiry)
4. Middleware checks session cookie on every `/admin/*` request
5. Admin layout does server-side `verifySessionCookie()` as double-check

### Data Access Pattern
- **Public users**: Can only `GET` jobs with status `INVOICED` or `PAID` (invoice viewing)
- **All writes**: Go through Server Actions using Firebase Admin SDK (bypasses Firestore rules)
- **Admin reads**: Use client SDK with `onSnapshot` (requires auth via Firestore rules)

### Key Security Modules
- `errors.ts` — Never exposes internal details; maps to user-friendly messages
- `validation.ts` — Zod schemas sanitize all inputs (strips HTML, validates formats)
- `rate-limit.ts` — IP-based rate limiting on quotes (5/15min) and login (5/5min)
- `env-validator.ts` — Validates all env vars at startup

---

## 📐 Coding Conventions

### General Rules
1. **Server Actions** are the primary backend — all mutations go through `actions.ts`
2. **"use server"** at the top of `actions.ts` — every exported function is a server action
3. **"use client"** on pages that need interactivity (admin dashboard, landing, quote form)
4. **Admin layout** (`admin/layout.tsx`) is a Server Component that guards all admin routes
5. Always use `validateId()` before using any Firestore document ID
6. Always use `requireAdmin()` at the start of any admin-only server action

### TypeScript
- Use strict types — avoid `any` where possible
- Define interfaces for Firestore document shapes
- Use Zod schemas for runtime validation, TypeScript for compile-time

### Styling
- Tailwind CSS 4 — utility classes only, no custom CSS unless absolutely necessary
- Color palette: Black (`#000`), Gold (`#D4AF37`), Gray scale
- Design language: Premium, minimal, modern
- Rounded corners: `rounded-2xl` or `rounded-3xl`
- Animations: Framer Motion for page transitions and hover effects

### Error Handling Pattern
```typescript
try {
    await requireAdmin();
    // ... business logic
} catch (error) {
    return handleServerActionError(error, 'actionName');
}
```

### Firebase Pattern
- Client SDK: Use `db` and `auth` from `@/lib/firebase` (client components only)
- Admin SDK: Use `adminDb` and `adminAuth` from `@/lib/firebase-admin` (server actions only)
- Never import `firebase-admin` in client components

---

## 🔧 Environment Variables

### Required (app won't work without these)
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

### Optional (features degrade gracefully)
```
RESEND_API_KEY          # Email sending
TWILIO_ACCOUNT_SID      # SMS notifications
TWILIO_AUTH_TOKEN        # SMS notifications
TWILIO_FROM_NUMBER       # SMS sender number
GOOGLE_CALENDAR_ID       # Calendar sync
NEXT_PUBLIC_SUPABASE_URL       # Audit logging
SUPABASE_SERVICE_ROLE_KEY      # Audit logging
```

---

## ⚠️ Known Issues & Gotchas

1. **Rate limiting is in-memory** — resets on every Vercel cold start. Fine for now, but consider Redis for scale.
2. **Geocoding is env-configurable** — set `MOCK_GEOCODING=false` in env to use real Google Maps geocoding. Defaults to mock (Toronto coords).
3. **Twilio initialization exists in both `actions.ts` and `services.ts`** — duplication that needs consolidation.
4. **Google Calendar auth exists in both `google.ts` and `services.ts`** — same issue, needs DRY refactor.
5. **The `services.ts` ServiceLayer.logEvent() uses Supabase** — will silently fail if Supabase isn't configured.

---

## 🧪 Testing

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- fsm.test.ts     # Run specific test
```

Test files go in `__tests__/` directory. Use `*.test.ts` naming convention.

Current test coverage:
- `fsm.test.ts` — FSM transition validation

---

## 🚢 Deployment

### Vercel (Production)
1. Push to `main` branch
2. Vercel auto-deploys
3. All env vars must be set in Vercel dashboard
4. Firestore rules deployed separately via Firebase CLI

### Pre-deployment Checklist
- [ ] `npm run build` passes with no errors
- [ ] All env vars configured in Vercel
- [ ] Stripe webhook endpoint registered: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Firestore rules deployed
- [ ] Firebase Auth email/password sign-in enabled

---

## 📊 Firestore Collections

### `jobs` Collection
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

### `clients` Collection
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

## 🔗 Key Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/quote` | Public | Quote submission form |
| `/login` | Public | Admin login |
| `/admin` | Protected | Job dashboard |
| `/admin/clients` | Protected | Client management |
| `/admin/clients/[id]` | Protected | Client detail |
| `/invoice/[id]` | Semi-public | Invoice view (INVOICED/PAID only) |
| `/privacy` | Public | Privacy policy |
| `/terms` | Public | Terms of service |
| `/api/auth/verify` | Internal | Session verification |
| `/api/webhooks/stripe` | Stripe | Payment webhook |
