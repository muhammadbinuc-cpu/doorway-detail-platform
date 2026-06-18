// 🔒 Server-only: render a job's invoice to a PDF buffer.
// Shared by the public download route and the invoice email attachment.
import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdf from "@/components/invoice/InvoicePdf";
import { computeInvoiceTotals, getDueDate } from "@/lib/invoice";
import { BUSINESS, formatInvoiceNumber } from "@/lib/business";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function renderInvoicePdf(
  job: any,
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
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: job.invoiceNotes || undefined,
    }),
  );
}
