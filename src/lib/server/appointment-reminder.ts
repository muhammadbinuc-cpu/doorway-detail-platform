// 🔒 Server-only: appointment-reminder sender. Lives OUTSIDE the "use server"
// module on purpose — exports there become public endpoints. Only reachable
// from the cron route (which authenticates via CRON_SECRET).
import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import twilio from "twilio";
import AppointmentReminderEmail from "@/components/email/AppointmentReminderEmail";
import { BUSINESS } from "@/lib/business";
import { sanitizeKey } from "@/lib/key-utils";
import { ServiceLayer } from "@/lib/services";
import { AppError, handleServerActionError } from "@/lib/errors";
import { validateId } from "@/lib/validation";
import { sendMail } from "@/lib/server/mailer";

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

const fmtDateLabel = (d: Date) =>
  d.toLocaleString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Send one appointment reminder (email + SMS, both non-blocking) for a SCHEDULED
 * job and mark it reminded so it's never sent twice. Caller authorizes.
 */
export async function runAppointmentReminder(jobId: string) {
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
    if (job.status !== "SCHEDULED")
      throw new AppError(
        "validation-error",
        `Job ${jobId} not SCHEDULED`,
        "Job is not scheduled",
      );
    if (!job.scheduledDate)
      throw new AppError(
        "validation-error",
        "No scheduledDate",
        "No appointment date",
      );

    const when = new Date(job.scheduledDate);
    const dateLabel = fmtDateLabel(when);
    const services = String(job.service || "your service").split(" | ")[0];

    if (job.email) {
      const emailResult = await sendMail({
        to: job.email,
        subject: `Reminder: your appointment is ${dateLabel}`,
        react: AppointmentReminderEmail({
          clientName: job.name,
          dateLabel,
          services,
          address: job.address || "",
          business: BUSINESS,
        }),
      });
      if (!emailResult.ok)
        console.error(
          "Appointment reminder email failed (non-blocking):",
          emailResult.error,
        );
    }

    if (job.phone) {
      try {
        await getTwilio().messages.create({
          body: `Hi ${job.name}, a reminder from ${BUSINESS.name}: your ${services} appointment is ${dateLabel}. We'll text when we're on the way. — ${BUSINESS.phone}`,
          from: process.env.TWILIO_FROM_NUMBER,
          to: job.phone,
        });
      } catch (e) {
        console.error("Appointment reminder SMS failed (non-blocking):", e);
      }
    }

    await ServiceLayer.logEvent("APPOINTMENT_REMINDER_SENT", { jobId });
    await jobRef.update({
      appointmentReminderSent: true,
      appointmentReminderAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "runAppointmentReminder");
  }
}
