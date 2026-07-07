// 🔒 Server-only: payment receipt sender. Shared by the Stripe webhook and the
// manual markInvoicePaid action. Non-blocking — never throws to its caller.
import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import PaymentReceiptEmail from "@/components/email/PaymentReceiptEmail";
import { computeInvoiceTotals } from "@/lib/invoice";
import { BUSINESS, formatInvoiceNumber } from "@/lib/business";
import { ServiceLayer } from "@/lib/services";
import { sendMail, type SendMailResult } from "@/lib/server/mailer";
import { recordEmailStatus } from "@/lib/server/email-status";

const METHOD_LABEL: Record<string, string> = {
  etransfer: "E-transfer",
  cash: "Cash",
  card: "Card",
};

/**
 * Email a paid-in-full receipt to the customer. Reads the (already-updated) job,
 * so call this AFTER the job has been marked PAID. Safe to call from anywhere —
 * never throws; returns the send result so callers can surface a warning.
 */
export async function sendPaymentReceipt(
  jobId: string,
): Promise<SendMailResult> {
  try {
    const jobRef = adminDb.collection("jobs").doc(jobId);
    const job = (await jobRef.get()).data();
    if (!job?.email)
      return { ok: false, error: "No customer email on the job" };

    const amount =
      typeof job.amountPaid === "number"
        ? job.amountPaid
        : computeInvoiceTotals(job).total;
    const method = METHOD_LABEL[job.paymentMethod as string] || "Card";
    const paidAt = job.paidAt?.toDate?.() ?? new Date();

    await ServiceLayer.logEvent("RECEIPT_SENT", { jobId });
    const result = await sendMail({
      to: job.email,
      subject: `Payment received — Invoice ${formatInvoiceNumber(job.invoiceNumber, jobId)}`,
      react: PaymentReceiptEmail({
        clientName: job.name,
        invoiceNumber: formatInvoiceNumber(job.invoiceNumber, jobId),
        amount,
        method,
        date: paidAt.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        business: BUSINESS,
      }),
    });
    if (!result.ok)
      console.error("Payment receipt failed (non-blocking):", result.error);
    await recordEmailStatus(jobRef, result);
    return result;
  } catch (e) {
    console.error("Payment receipt failed (non-blocking):", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
