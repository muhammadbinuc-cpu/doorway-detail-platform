// 🔒 Server-only: render a job's invoice to a PDF buffer.
// Shared by the public download route and the invoice email attachment.
import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdf from "@/components/invoice/InvoicePdf";
import {
  computeInvoiceTotals,
  getDueDate,
  type InvoiceJobLike,
} from "@/lib/invoice";
import {
  BUSINESS,
  formatInvoiceNumber,
  formatQuoteNumber,
} from "@/lib/business";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Firestore Timestamp | {seconds} | Date → Date
function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const anyV = v as { toDate?: () => Date; seconds?: number };
  if (typeof anyV.toDate === "function") return anyV.toDate();
  if (typeof anyV.seconds === "number") return new Date(anyV.seconds * 1000);
  return null;
}

interface InvoicePdfJob extends InvoiceJobLike {
  invoicedAt?: unknown;
  invoiceNumber?: number;
  name?: string;
  address?: string;
  status?: string;
  invoiceNotes?: string;
}

interface QuotePdfJob extends InvoiceJobLike {
  quoteSentAt?: unknown;
  quoteValidUntil?: unknown;
  quoteNumber?: number;
  name?: string;
  address?: string;
  invoiceNotes?: string;
}

export async function renderInvoicePdf(
  job: InvoicePdfJob,
  jobId: string,
): Promise<Buffer> {
  const totals = computeInvoiceTotals(job);
  const invoicedAt = toDate(job.invoicedAt);
  const dueDate = getDueDate(invoicedAt);
  return renderToBuffer(
    InvoicePdf({
      businessName: BUSINESS.name,
      businessAddress: BUSINESS.address,
      businessPhone: BUSINESS.phone,
      hstNumber: BUSINESS.hstNumber,
      clientName: job.name ?? "",
      clientAddress: job.address ?? "",
      invoiceLabel: formatInvoiceNumber(job.invoiceNumber, jobId),
      issuedDate: fmtDate(invoicedAt ?? new Date()),
      dueDate: fmtDate(dueDate),
      status: job.status ?? "",
      lineItems: totals.lineItems,
      // Included-items list only applies in the lump "one price + list" mode
      // (i.e. when there are no explicit priced line items).
      invoiceItems:
        Array.isArray(job.lineItems) && job.lineItems.length > 0
          ? undefined
          : job.invoiceItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: job.invoiceNotes || undefined,
    }),
  );
}

/** Same document as the invoice PDF, rendered with quote wording. */
export async function renderQuotePdf(
  job: QuotePdfJob,
  jobId: string,
): Promise<Buffer> {
  const totals = computeInvoiceTotals(job);
  const sentAt = toDate(job.quoteSentAt) ?? new Date();
  const validUntil = toDate(job.quoteValidUntil) ?? sentAt;
  return renderToBuffer(
    InvoicePdf({
      docType: "QUOTE",
      businessName: BUSINESS.name,
      businessAddress: BUSINESS.address,
      businessPhone: BUSINESS.phone,
      hstNumber: BUSINESS.hstNumber,
      clientName: job.name ?? "",
      clientAddress: job.address ?? "",
      invoiceLabel: formatQuoteNumber(job.quoteNumber, jobId),
      issuedDate: fmtDate(sentAt),
      dueDate: fmtDate(validUntil),
      status: "",
      lineItems: totals.lineItems,
      invoiceItems:
        Array.isArray(job.lineItems) && job.lineItems.length > 0
          ? undefined
          : job.invoiceItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: job.invoiceNotes || undefined,
    }),
  );
}
