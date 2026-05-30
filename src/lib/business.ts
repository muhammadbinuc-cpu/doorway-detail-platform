// 🔒 src/lib/business.ts — Single source of truth for business identity + invoice config.
// Isomorphic: safe to import in both server actions and client components.

export const BUSINESS = {
    name: "Doorway Detail",
    address: "Oakville, Ontario",
    phone: "289-772-5757",
    email: "Doorwaydetail@gmail.com",
    // HST/GST number is legally required on invoices for a registered business.
    // Set BUSINESS_HST_NUMBER in env to display it; falls back to empty (hidden) if unset.
    hstNumber: process.env.BUSINESS_HST_NUMBER || "",
} as const;

export type Business = typeof BUSINESS;

// Payment terms: invoice due this many days after it's issued.
export const PAYMENT_TERMS_DAYS = 14;

// First invoice reads #1001 (looks established), counter is seeded at this value.
export const INVOICE_NUMBER_START = 1000;

/**
 * Format an invoice number for display.
 * Uses the real sequential number once assigned (e.g. "#1001"); otherwise
 * falls back to a short id-derived code so un-invoiced jobs still show something.
 */
export function formatInvoiceNumber(invoiceNumber: number | undefined | null, jobId: string): string {
    if (typeof invoiceNumber === "number" && invoiceNumber > 0) {
        return `#${invoiceNumber}`;
    }
    return `#${jobId.slice(0, 6).toUpperCase()}`;
}
