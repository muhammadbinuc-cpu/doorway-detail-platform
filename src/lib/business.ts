// 🔒 src/lib/business.ts — Single source of truth for business identity + invoice config.
// Isomorphic: safe to import in both server actions and client components.

export const BUSINESS = {
  name: "Doorway Detail",
  address: "Oakville, Ontario",
  phone: "289-772-5757",
  email: "Doorwaydetail@gmail.com",
  // HST/GST number is legally required on invoices for a registered business.
  // Prefer NEXT_PUBLIC_BUSINESS_HST_NUMBER so it's available in client components
  // (the public invoice page); fall back to the server-only var for email contexts.
  // An HST number is printed publicly on invoices, so exposing it client-side is fine.
  hstNumber:
    process.env.NEXT_PUBLIC_BUSINESS_HST_NUMBER ||
    process.env.BUSINESS_HST_NUMBER ||
    "",
  // Google review link for the post-job review request. Leave unset to skip
  // sending review requests. NEXT_PUBLIC_ so client surfaces can use it too.
  reviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "",
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
export function formatInvoiceNumber(
  invoiceNumber: number | undefined | null,
  jobId: string,
): string {
  if (typeof invoiceNumber === "number" && invoiceNumber > 0) {
    return `#${invoiceNumber}`;
  }
  return `#${jobId.slice(0, 6).toUpperCase()}`;
}
