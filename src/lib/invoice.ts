// 🔒 src/lib/invoice.ts — Single source of truth for invoice math.
// Isomorphic (no firebase imports): used by the invoice page, the email, the
// Stripe checkout action, and the admin view so the total can never drift.

import { PAYMENT_TERMS_DAYS } from "./business";

export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface InvoiceTotals {
    lineItems: LineItem[];
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
}

// Minimal shape of a job needed to compute an invoice. Kept loose so both the
// admin Job type and raw Firestore data satisfy it.
export interface InvoiceJobLike {
    service?: string;
    price?: number;
    discount?: number;
    taxRate?: number;
    lineItems?: LineItem[];
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Normalize a job's line items. If the job has no explicit lineItems, fall back
 * to a single line built from its legacy `service` + `price` fields so older
 * jobs keep working unchanged.
 */
export function normalizeLineItems(job: InvoiceJobLike): LineItem[] {
    const items = Array.isArray(job.lineItems)
        ? job.lineItems.filter((li) => li && (Number(li.quantity) || 0) > 0)
        : [];

    if (items.length > 0) {
        return items.map((li) => ({
            description: String(li.description || "Service"),
            quantity: Number(li.quantity) || 0,
            unitPrice: Number(li.unitPrice) || 0,
        }));
    }

    return [
        {
            description: job.service || "Cleaning Service",
            quantity: 1,
            unitPrice: Number(job.price) || 0,
        },
    ];
}

/**
 * Compute invoice totals from a job. THE single source of truth — every surface
 * (web invoice, email, Stripe checkout, admin) must use this.
 */
export function computeInvoiceTotals(job: InvoiceJobLike): InvoiceTotals {
    const lineItems = normalizeLineItems(job);
    const subtotalRaw = lineItems.reduce((acc, li) => acc + li.quantity * li.unitPrice, 0);
    const subtotal = round2(subtotalRaw);

    const discount = round2(Math.min(Number(job.discount) || 0, subtotal));
    const taxRate = Number(job.taxRate) || 0;
    const taxable = subtotal - discount;
    const taxAmount = round2(taxable * (taxRate / 100));
    const total = round2(taxable + taxAmount);

    return { lineItems, subtotal, discount, taxRate, taxAmount, total };
}

/**
 * Derive the due date from the issue date (defaults to now if not yet invoiced).
 */
export function getDueDate(invoicedAt?: Date | null): Date {
    const base = invoicedAt ?? new Date();
    const due = new Date(base);
    due.setDate(due.getDate() + PAYMENT_TERMS_DAYS);
    return due;
}

// --- Reminder / overdue logic (shared by the cron route + admin UI) ---

export const REMINDER_MAX = 3;          // never send more than this many reminders
export const REMINDER_GAP_DAYS = 3;     // wait at least this long between reminders
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderJobLike {
    status?: string;
    invoicedAt?: Date | null;
    lastReminderAt?: Date | null;
    reminderCount?: number;
}

/** An invoice is overdue if it's unpaid and past its due date. */
export function isOverdue(job: ReminderJobLike, now: Date = new Date()): boolean {
    if (job.status !== "INVOICED" && job.status !== "UNPAID") return false;
    if (!job.invoicedAt) return false;
    return now.getTime() > getDueDate(job.invoicedAt).getTime();
}

/**
 * Whether the auto-chase cron should send a reminder for this job right now:
 * overdue, under the reminder cap, and past the inter-reminder gap.
 */
export function isReminderDue(job: ReminderJobLike, now: Date = new Date()): boolean {
    if (!isOverdue(job, now)) return false;
    if ((job.reminderCount ?? 0) >= REMINDER_MAX) return false;
    if (!job.lastReminderAt) return true;
    return now.getTime() - job.lastReminderAt.getTime() >= REMINDER_GAP_DAYS * DAY_MS;
}
