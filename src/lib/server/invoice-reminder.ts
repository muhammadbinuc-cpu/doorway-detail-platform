// 🔒 Server-only: payment-reminder sender. Lives OUTSIDE the "use server" module
// on purpose — exports there become public endpoints. This is only reachable
// from the admin action (which gates on requireAdmin) and the cron route (which
// authenticates via CRON_SECRET).
import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import twilio from "twilio";
import InvoiceReminderEmail from "@/components/email/InvoiceReminderEmail";
import { computeInvoiceTotals, getDueDate } from "@/lib/invoice";
import { BUSINESS, formatInvoiceNumber } from "@/lib/business";
import { sanitizeKey } from "@/lib/key-utils";
import { ServiceLayer } from "@/lib/services";
import { AppError, handleServerActionError } from "@/lib/errors";
import { validateId } from "@/lib/validation";
import { sendMail } from "@/lib/server/mailer";
import {
  recordEmailStatus,
  resolveRecipientEmail,
} from "@/lib/server/email-status";

const PAYABLE_STATUSES = new Set(["INVOICED", "UNPAID"]);

let _twilio: ReturnType<typeof twilio> | null = null;
function getTwilio(): ReturnType<typeof twilio> {
  if (!_twilio) {
    const sid = sanitizeKey(process.env.TWILIO_ACCOUNT_SID);
    const token = sanitizeKey(process.env.TWILIO_AUTH_TOKEN);
    if (!sid || !token)
      throw new AppError(
        "config-error",
        "Twilio credentials missing",
        "SMS service not configured",
      );
    _twilio = twilio(sid, token);
  }
  return _twilio;
}

/**
 * Send one payment reminder (email + SMS, both non-blocking) and bump the
 * job's reminder counters. Caller is responsible for authorization.
 */
export async function runInvoiceReminder(jobId: string) {
  try {
    validateId(jobId);
    const jobRef = adminDb.collection("jobs").doc(jobId);
    const job = (await jobRef.get()).data();
    if (!job)
      throw new AppError(
        "not-found",
        `Job ${jobId} not found`,
        "Job not found",
      );
    if (!PAYABLE_STATUSES.has(job.status)) {
      throw new AppError(
        "validation-error",
        `Job ${jobId} not payable from ${job.status}`,
        "This invoice is already settled.",
      );
    }
    const recipient = await resolveRecipientEmail(jobRef, job);
    if (!recipient)
      throw new AppError(
        "validation-error",
        "No email on job",
        "Customer email not found",
      );

    const totals = computeInvoiceTotals(job);
    const invoicedAt = job.invoicedAt?.toDate?.() ?? null;
    const dueStr = getDueDate(invoicedAt).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const invoiceLabel = formatInvoiceNumber(job.invoiceNumber, jobId);
    const invoiceUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${jobId}`;

    const emailResult = await sendMail({
      to: recipient,
      subject: `Payment reminder — Invoice ${invoiceLabel}`,
      react: InvoiceReminderEmail({
        clientName: job.name,
        invoiceNumber: invoiceLabel,
        invoiceUrl,
        total: totals.total,
        dueDate: dueStr,
        business: BUSINESS,
      }),
    });
    if (!emailResult.ok)
      console.error("Reminder email failed (non-blocking):", emailResult.error);
    await recordEmailStatus(jobRef, emailResult);

    if (job.phone) {
      try {
        await getTwilio().messages.create({
          body: `Hi ${job.name}, a friendly reminder that invoice ${invoiceLabel} ($${totals.total.toFixed(2)}) is due. Pay here: ${invoiceUrl} — ${BUSINESS.phone}`,
          from: process.env.TWILIO_FROM_NUMBER,
          to: job.phone,
        });
      } catch (e) {
        console.error("Reminder SMS failed (non-blocking):", e);
      }
    }

    await ServiceLayer.logEvent("INVOICE_REMINDER_SENT", { jobId });
    await jobRef.update({
      reminderCount: (Number(job.reminderCount) || 0) + 1,
      lastReminderAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "runInvoiceReminder");
  }
}
