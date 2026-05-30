// 🔒 Server-only: payment receipt sender. Shared by the Stripe webhook and the
// manual markInvoicePaid action. Non-blocking — never throws to its caller.
import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";
import PaymentReceiptEmail from "@/components/email/PaymentReceiptEmail";
import { computeInvoiceTotals } from "@/lib/invoice";
import { BUSINESS, formatInvoiceNumber } from "@/lib/business";
import { sanitizeKey } from "@/lib/key-utils";
import { ServiceLayer } from "@/lib/services";

const METHOD_LABEL: Record<string, string> = { etransfer: "E-transfer", cash: "Cash", card: "Card" };

let _resend: Resend | null = null;
function getResend(): Resend | null {
    if (!_resend) {
        const key = sanitizeKey(process.env.RESEND_API_KEY);
        if (!key) return null;
        _resend = new Resend(key);
    }
    return _resend;
}

/**
 * Email a paid-in-full receipt to the customer. Reads the (already-updated) job,
 * so call this AFTER the job has been marked PAID. Safe to call from anywhere —
 * a missing email/key or send failure is swallowed.
 */
export async function sendPaymentReceipt(jobId: string): Promise<void> {
    try {
        const job = (await adminDb.collection("jobs").doc(jobId).get()).data();
        if (!job?.email) return;

        const resend = getResend();
        if (!resend) return;

        const amount = typeof job.amountPaid === "number" ? job.amountPaid : computeInvoiceTotals(job).total;
        const method = METHOD_LABEL[job.paymentMethod as string] || "Card";
        const paidAt = job.paidAt?.toDate?.() ?? new Date();

        await ServiceLayer.logEvent("RECEIPT_SENT", { jobId });
        await resend.emails.send({
            from: "DoorWay Detail <onboarding@resend.dev>",
            to: job.email,
            subject: `Payment received — Invoice ${formatInvoiceNumber(job.invoiceNumber, jobId)}`,
            react: PaymentReceiptEmail({
                clientName: job.name,
                invoiceNumber: formatInvoiceNumber(job.invoiceNumber, jobId),
                amount,
                method,
                date: paidAt.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }),
                business: BUSINESS,
            }),
        });
    } catch (e) {
        console.error("Payment receipt failed (non-blocking):", e);
    }
}
