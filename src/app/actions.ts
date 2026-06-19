"use server";

// 🔒 ============================================
// 🔒 SECURE SERVER ACTIONS - Doorway Detail SaaS
// 🔒 ============================================

import { revalidatePath } from "next/cache";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from "next/headers";
import twilio from "twilio";
import { ServiceLayer } from "@/lib/services";
import Stripe from "stripe";
import { ZodError } from "zod";
import InvoiceEmail from "@/components/email/InvoiceEmail";
import QuoteConfirmationEmail from "@/components/email/QuoteConfirmationEmail";
import { computeInvoiceTotals, getDueDate } from "@/lib/invoice";
import {
  BUSINESS,
  INVOICE_NUMBER_START,
  formatInvoiceNumber,
} from "@/lib/business";
import { runInvoiceReminder } from "@/lib/server/invoice-reminder";
import { sendPaymentReceipt } from "@/lib/server/payment-receipt";
import { sendMail } from "@/lib/server/mailer";
import { renderInvoicePdf } from "@/lib/server/invoice-pdf";

// 🔒 Security imports
import {
  handleServerActionError,
  createFsmError,
  AppError,
} from "@/lib/errors";
import {
  validateQuote,
  validateJobUpdate,
  validateClient,
  validateInvoiceCreate,
  validateId,
  validateBooking,
  validatePaymentMethod,
  validateService,
} from "@/lib/validation";
import { enforceRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { isValidTransition, JOB_WORKFLOW } from "@/lib/fsm_logic";
import { sanitizeKey } from "@/lib/key-utils";

const MOCK_GEOCODING = process.env.MOCK_GEOCODING !== "false";
const SESSION_COOKIE_NAME = "__session";
const SESSION_COOKIE_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const PAYABLE_STATUSES = new Set(["INVOICED", "UNPAID"]);

function getErrorCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "unknown";
}

// --- STRIPE INIT ---
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key)
      throw new AppError(
        "config-error",
        "STRIPE_SECRET_KEY is undefined",
        "Payment service unavailable",
      );
    _stripe = new Stripe(key, { apiVersion: "2025-12-15.clover" });
  }
  return _stripe;
}

// --- SMS INIT --- (email is sent via @/lib/server/mailer — Gmail SMTP)
let _twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient(): ReturnType<typeof twilio> {
  if (!_twilioClient) {
    const sid = sanitizeKey(process.env.TWILIO_ACCOUNT_SID);
    const token = sanitizeKey(process.env.TWILIO_AUTH_TOKEN);
    if (!sid || !token)
      throw new AppError(
        "config-error",
        "Twilio credentials missing",
        "SMS service not configured",
      );
    _twilioClient = twilio(sid, token);
  }
  return _twilioClient;
}

// 🔒 Secure session verification
async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value)
    throw new AppError("unauthorized", "No session cookie", "Access denied.");
  try {
    await adminAuth.verifySessionCookie(sessionCookie.value, true);
  } catch (error) {
    throw new AppError(
      "unauthorized",
      `Session invalid: ${getErrorCode(error)}`,
      "Session expired.",
    );
  }
}

/**
 * 🔒 Atomically assign a sequential invoice number to a job (idempotent).
 * Runs in a transaction so concurrent sends can't collide, and re-sending an
 * already-invoiced job never bumps the number. Returns the job's number + issue date.
 */
async function assignInvoiceNumber(
  jobRef: DocumentReference,
): Promise<{ invoiceNumber: number; invoicedAt: Date }> {
  const counterRef = adminDb.collection("counters").doc("invoices");

  return adminDb.runTransaction(async (tx) => {
    const jobSnap = await tx.get(jobRef);
    const job = jobSnap.data();
    if (!job)
      throw new AppError(
        "not-found",
        `Job ${jobRef.id} not found`,
        "Job not found",
      );

    // Idempotent: already invoiced → return existing number, don't bump.
    if (typeof job.invoiceNumber === "number" && job.invoiceNumber > 0) {
      const existingAt = job.invoicedAt?.toDate?.() ?? new Date();
      return { invoiceNumber: job.invoiceNumber, invoicedAt: existingAt };
    }

    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists
      ? (counterSnap.data()?.current ?? INVOICE_NUMBER_START)
      : INVOICE_NUMBER_START;
    const next = current + 1;

    const invoicedAt = new Date();
    tx.set(counterRef, { current: next }, { merge: true });
    tx.update(jobRef, {
      invoiceNumber: next,
      invoicedAt: Timestamp.fromDate(invoicedAt),
    });

    return { invoiceNumber: next, invoicedAt };
  });
}

function buildLineItemServiceSummary(
  lineItems: { description: string; quantity: number }[],
): string {
  return (
    lineItems
      .map((item) =>
        item.quantity > 1
          ? `${item.description} (${item.quantity})`
          : item.description,
      )
      .join(", ") || "Cleaning Service"
  );
}

// ============================================
// 🔒 AUTH ACTIONS
// ============================================
export async function verifyFirebaseLogin(idToken: string) {
  try {
    await enforceRateLimit("login");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_EXPIRES_MS,
    });
    (await cookies()).set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE_EXPIRES_MS / 1000,
      path: "/",
    });
    resetRateLimit("login", decodedToken.email || decodedToken.uid);
    return { success: true, email: decodedToken.email };
  } catch (error) {
    return handleServerActionError(error, "verifyFirebaseLogin");
  }
}

export async function revokeSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(
          sessionCookie.value,
        );
        await adminAuth.revokeRefreshTokens(decodedClaims.uid);
      } catch {}
    }
    (await cookies()).delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "revokeSession");
  }
}

// ============================================
// 🔒 PUBLIC ACTIONS
// ============================================
export async function submitQuote(formData: unknown) {
  try {
    await enforceRateLimit("quote");
    const { name, email, phone, address, service } = validateQuote(formData);
    await ServiceLayer.logEvent("QUOTE_SUBMITTED", { email });

    let clientId: string;
    const q = await adminDb
      .collection("clients")
      .where("email", "==", email)
      .get();

    if (!q.empty) {
      clientId = q.docs[0].id;
      await adminDb
        .collection("clients")
        .doc(clientId)
        .update({ name, phone, address, lastUpdated: Timestamp.now() });
    } else {
      const coords = await getGeocode(address);
      const newClient = await adminDb.collection("clients").add({
        name,
        email,
        phone,
        address,
        geolocation: coords || { lat: 0, lng: 0 },
        status: "LEAD",
        createdAt: Timestamp.now(),
      });
      clientId = newClient.id;
    }

    const newJob = await adminDb.collection("jobs").add({
      clientId,
      name,
      email,
      phone,
      address,
      service,
      status: "LEAD_RECEIVED",
      createdAt: Timestamp.now(),
    });

    // 🟢 Instant confirmation to the customer — non-blocking: a missing
    // Resend/Twilio key (or a send failure) must NEVER fail lead capture.
    await sendQuoteConfirmation({ name, email, phone, service });

    return { success: true, jobId: newJob.id };
  } catch (error) {
    if (error instanceof ZodError)
      return { success: false, error: error.issues[0].message };
    return handleServerActionError(error, "submitQuote");
  }
}

/**
 * Fire-and-forget confirmation to a new lead. Each channel is independently
 * guarded; the whole helper never throws so it can't break submitQuote.
 */
async function sendQuoteConfirmation(lead: {
  name: string;
  email: string;
  phone: string;
  service: string;
}) {
  // Show the services list without the internal notes/meta suffix.
  const services = lead.service.split(" | ")[0] || lead.service;

  const emailResult = await sendMail({
    to: lead.email,
    subject: "We got your request — Doorway Detail",
    react: QuoteConfirmationEmail({
      clientName: lead.name,
      services,
      business: BUSINESS,
    }),
  });
  if (!emailResult.ok) {
    console.error(
      "Quote confirmation email failed (non-blocking):",
      emailResult.error,
    );
  }

  if (lead.phone) {
    try {
      const twilio = getTwilioClient();
      await twilio.messages.create({
        body: `Hi ${lead.name}, ${BUSINESS.name} received your request for ${services}. We'll text or call shortly to confirm. — ${BUSINESS.phone}`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: lead.phone,
      });
    } catch (e) {
      console.error("Quote confirmation SMS failed (non-blocking):", e);
    }
  }

  try {
    await ServiceLayer.logEvent("QUOTE_CONFIRMATION_SENT", {
      email: lead.email,
    });
  } catch {
    /* logging is best-effort */
  }
}

// ============================================
// 🔒 PROTECTED ADMIN ACTIONS
// ============================================
export async function createService(serviceData: unknown) {
  try {
    await requireAdmin();
    const validated = validateService(serviceData);
    const serviceRef = await adminDb.collection("services").add({
      name: validated.name,
      description: validated.description || "",
      unitPrice: validated.unitPrice,
      createdAt: Timestamp.now(),
    });
    revalidatePath("/admin/services");
    return { success: true, serviceId: serviceRef.id };
  } catch (error) {
    return handleServerActionError(error, "createService");
  }
}

export async function updateService(id: string, serviceData: unknown) {
  try {
    await requireAdmin();
    const serviceId = validateId(id);
    const validated = validateService(serviceData);
    await adminDb
      .collection("services")
      .doc(serviceId)
      .update({
        name: validated.name,
        description: validated.description || "",
        unitPrice: validated.unitPrice,
        lastUpdated: Timestamp.now(),
      });
    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "updateService");
  }
}

export async function deleteService(id: string) {
  try {
    await requireAdmin();
    const serviceId = validateId(id);
    await adminDb.collection("services").doc(serviceId).delete();
    revalidatePath("/admin/services");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "deleteService");
  }
}

export async function createClient(clientData: unknown) {
  await requireAdmin();
  try {
    const validated = validateClient(clientData);
    const coordinates = await getGeocode(validated.address);
    const newClient = await adminDb.collection("clients").add({
      ...validated,
      propertyNotes: validated.propertyNotes || "",
      geolocation: coordinates || { lat: 0, lng: 0 },
      status: "LEAD",
      createdAt: Timestamp.now(),
    });
    return { success: true, clientId: newClient.id };
  } catch (error) {
    if (error instanceof ZodError)
      return { success: false, error: error.issues[0].message };
    return handleServerActionError(error, "createClient");
  }
}

export async function deleteClient(clientId: string) {
  await requireAdmin();
  try {
    validateId(clientId);
    await adminDb.collection("clients").doc(clientId).delete();
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "deleteClient");
  }
}

export async function updateClientNotes(clientId: string, notes: string) {
  await requireAdmin();
  try {
    validateId(clientId);
    const sanitizedNotes = notes
      .trim()
      .slice(0, 2000)
      .replace(/<[^>]*>/g, "");
    await adminDb
      .collection("clients")
      .doc(clientId)
      .update({ propertyNotes: sanitizedNotes, lastUpdated: Timestamp.now() });
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "updateClientNotes");
  }
}

export async function createJobFromClient(clientId: string) {
  await requireAdmin();
  try {
    validateId(clientId);
    const client = (
      await adminDb.collection("clients").doc(clientId).get()
    ).data();
    if (!client)
      throw new AppError(
        "not-found",
        `Client ${clientId} not found`,
        "Client not found",
      );

    const res = await adminDb.collection("jobs").add({
      clientId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      service: "Window Cleaning",
      status: "LEAD_RECEIVED",
      createdAt: Timestamp.now(),
      price: 0,
    });
    return { success: true, jobId: res.id };
  } catch (error) {
    return handleServerActionError(error, "createJobFromClient");
  }
}

export async function updateJobStatus(jobId: string, newStatus: string) {
  await requireAdmin();
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

    if (!isValidTransition(job.status, newStatus)) {
      await ServiceLayer.logEvent("FSM_VIOLATION", {
        jobId,
        from: job.status,
        to: newStatus,
      });
      throw createFsmError(
        job.status,
        newStatus,
        JOB_WORKFLOW[job.status] || [],
      );
    }

    // Assign a sequential invoice number the first time a job becomes INVOICED
    // (so jobs flipped manually via the dropdown still get a real number).
    if (newStatus === "INVOICED") {
      await assignInvoiceNumber(jobRef);
    }

    await jobRef.update({ status: newStatus, lastUpdated: Timestamp.now() });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "updateJobStatus");
  }
}

/**
 * 🔒 Void (cancel) an invoice. Moves an INVOICED/UNPAID job to CANCELLED so a
 * mistaken invoice can be retracted without deleting the whole job record.
 */
export async function voidInvoice(jobId: string) {
  await requireAdmin();
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

    if (!isValidTransition(job.status, "CANCELLED")) {
      throw createFsmError(
        job.status,
        "CANCELLED",
        JOB_WORKFLOW[job.status] || [],
      );
    }

    await ServiceLayer.logEvent("INVOICE_VOIDED", { jobId, from: job.status });
    await jobRef.update({
      status: "CANCELLED",
      voidedAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    });
    revalidatePath("/admin");
    revalidatePath("/admin/invoices");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "voidInvoice");
  }
}

export async function confirmBooking(jobId: string, date: string) {
  await requireAdmin();
  try {
    const validated = validateBooking(jobId, date);
    await ServiceLayer.logEvent("BOOKING_CONFIRMED", {
      jobId: validated.jobId,
      date: validated.date,
    });
    const jobRef = adminDb.collection("jobs").doc(validated.jobId);
    const job = (await jobRef.get()).data();
    if (!job) throw new AppError("not-found", `Job not found`, "Job not found");

    try {
      await addToGoogleCalendar(
        {
          title: `Service: ${job.name}`,
          description: `Phone: ${job.phone}`,
          location: job.address,
        },
        validated.date,
      );
    } catch (e) {
      console.error("Calendar sync failed:", e);
    }

    if (job.phone) {
      try {
        const twilio = getTwilioClient();
        const dateStr = new Date(validated.date).toLocaleDateString();
        const msg =
          job.status === "SCHEDULED"
            ? `Hi ${job.name}, rescheduled to ${dateStr}.`
            : `Hi ${job.name}, confirmed for ${dateStr}.`;
        await twilio.messages.create({
          body: msg,
          from: process.env.TWILIO_FROM_NUMBER,
          to: job.phone,
        });
      } catch (e) {
        console.error("SMS failed:", e);
      }
    }

    await jobRef.update({
      status: "SCHEDULED",
      scheduledDate: validated.date,
      lastUpdated: Timestamp.now(),
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError)
      return { success: false, error: error.issues[0].message };
    return handleServerActionError(error, "confirmBooking");
  }
}

export async function updateJobDetails(jobId: string, data: unknown) {
  await requireAdmin();
  try {
    validateId(jobId);
    const validated = validateJobUpdate(data);
    await adminDb
      .collection("jobs")
      .doc(jobId)
      .update({ ...validated, lastUpdated: Timestamp.now() });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError)
      return { success: false, error: error.issues[0].message };
    return handleServerActionError(error, "updateJobDetails");
  }
}

export async function createInvoiceForClient(clientId: string, data: unknown) {
  try {
    await requireAdmin();
    const validClientId = validateId(clientId);
    const validated = validateInvoiceCreate(data);
    const clientSnap = await adminDb
      .collection("clients")
      .doc(validClientId)
      .get();
    const client = clientSnap.data();
    if (!client)
      throw new AppError(
        "not-found",
        `Client ${validClientId} not found`,
        "Client not found",
      );

    const jobRef = await adminDb.collection("jobs").add({
      clientId: validClientId,
      name: String(client.name || ""),
      email: String(client.email || ""),
      phone: String(client.phone || ""),
      address: String(client.address || ""),
      service: buildLineItemServiceSummary(validated.lineItems),
      status: "INVOICED",
      lineItems: validated.lineItems,
      discount: validated.discount ?? 0,
      taxRate: validated.taxRate ?? 0,
      invoiceNotes: validated.invoiceNotes || "",
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    });

    await assignInvoiceNumber(jobRef);
    revalidatePath("/admin");
    revalidatePath("/admin/invoices");
    return { success: true, jobId: jobRef.id };
  } catch (error) {
    return handleServerActionError(error, "createInvoiceForClient");
  }
}

/**
 * 🔒 Send invoice email to customer
 */
export async function emailInvoice(jobId: string) {
  await requireAdmin();
  try {
    validateId(jobId);
    const jobRef = adminDb.collection("jobs").doc(jobId);
    const job = (await jobRef.get()).data();

    if (!job?.email)
      throw new AppError(
        "validation-error",
        "No email on job",
        "Customer email not found",
      );
    await ServiceLayer.logEvent("INVOICE_SENT", { jobId, email: job.email });

    // Assign a real sequential invoice number (idempotent) before sending.
    const { invoiceNumber, invoicedAt } = await assignInvoiceNumber(jobRef);
    const totals = computeInvoiceTotals(job);
    const dueDate = getDueDate(invoicedAt);
    const invoiceLabel = formatInvoiceNumber(invoiceNumber, jobId);

    // Attach a PDF copy so the customer always has a saved record.
    const pdf = await renderInvoicePdf(
      { ...job, invoiceNumber, invoicedAt },
      jobId,
    );

    // 🟢 Professional React Email with full breakdown + PDF attachment.
    const result = await sendMail({
      to: job.email,
      subject: `Invoice ${invoiceLabel} from Doorway Detail`,
      react: InvoiceEmail({
        clientName: job.name,
        invoiceNumber: invoiceLabel,
        invoiceUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${jobId}`,
        lineItems: totals.lineItems,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        invoiceNotes: job.invoiceNotes || undefined,
        dueDate: dueDate.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        business: BUSINESS,
      }),
      attachments: [
        {
          filename: `Invoice-${invoiceLabel.replace("#", "")}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    if (job.phone) {
      try {
        const twilio = getTwilioClient();
        await twilio.messages.create({
          body: `Hi ${job.name}, your Doorway Detail invoice is ready. Please check your email.`,
          from: process.env.TWILIO_FROM_NUMBER,
          to: job.phone,
        });
      } catch (e) {
        console.error("SMS notification failed:", e);
      }
    }

    // The invoice IS issued regardless of delivery — surface a warning, don't fail.
    await jobRef.update({ status: "INVOICED", lastUpdated: Timestamp.now() });
    revalidatePath("/admin");
    return result.ok
      ? { success: true }
      : {
          success: true,
          deliveryWarning: `Invoice saved, but the email didn't send: ${result.error}`,
        };
  } catch (error) {
    return handleServerActionError(error, "emailInvoice");
  }
}

/**
 * 🔒 Manually mark an invoice paid (e-transfer / cash / card) — for payments
 * collected outside Stripe. Stripe payments are handled by the webhook.
 */
export async function markInvoicePaid(jobId: string, method: string) {
  await requireAdmin();
  try {
    validateId(jobId);
    const validMethod = validatePaymentMethod(method);
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
        "This invoice cannot be marked paid.",
      );
    }

    const { total } = computeInvoiceTotals(job);
    await ServiceLayer.logEvent("INVOICE_MARKED_PAID", {
      jobId,
      method: validMethod,
      amount: total,
    });
    await jobRef.update({
      status: "PAID",
      paidAt: Timestamp.now(),
      paymentMethod: validMethod,
      amountPaid: total,
      lastUpdated: Timestamp.now(),
    });
    await sendPaymentReceipt(jobId); // non-blocking
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError)
      return { success: false, error: error.issues[0].message };
    return handleServerActionError(error, "markInvoicePaid");
  }
}

/**
 * 🔒 Manual "Send reminder" button for an overdue/unpaid invoice. The actual
 * send lives in a server-only module so it's never exposed as a public action.
 */
export async function sendInvoiceReminder(jobId: string) {
  await requireAdmin();
  const res = await runInvoiceReminder(jobId);
  if (res.success) revalidatePath("/admin");
  return res;
}

export async function sendOnMyWay(jobId: string) {
  await requireAdmin();
  try {
    validateId(jobId);
    const jobRef = adminDb.collection("jobs").doc(jobId);
    const job = (await jobRef.get()).data();
    if (!job || !job.phone)
      throw new AppError(
        "validation-error",
        "Job/Phone missing",
        "Phone number not found",
      );

    await ServiceLayer.logEvent("ON_MY_WAY_SENT", { jobId });
    const twilio = getTwilioClient();
    await twilio.messages.create({
      body: `🚗 Hi ${job.name}, DoorWay Detail is on the way! ETA: 20-30 mins.`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: job.phone,
    });
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "sendOnMyWay");
  }
}

export async function createRecurringJob(originalJobId: string) {
  await requireAdmin();
  try {
    validateId(originalJobId);
    const originalJob = (
      await adminDb.collection("jobs").doc(originalJobId).get()
    ).data();
    if (!originalJob)
      throw new AppError("not-found", `Job not found`, "Job not found");

    const newJob = await adminDb.collection("jobs").add({
      ...originalJob,
      status: "LEAD_RECEIVED",
      createdAt: Timestamp.now(),
      scheduledDate: null,
      service: originalJob.service + " (Recurring)",
      price: originalJob.price,
      // Don't carry the prior invoice identity onto the new cycle.
      invoiceNumber: null,
      invoicedAt: null,
    });
    revalidatePath("/admin");
    return { success: true, jobId: newJob.id };
  } catch (error) {
    return handleServerActionError(error, "createRecurringJob");
  }
}

export async function createCheckoutSession(jobId: string) {
  try {
    const validJobId = validateId(jobId);
    const job = (await adminDb.collection("jobs").doc(validJobId).get()).data();
    if (!job)
      throw new AppError("not-found", `Job not found`, "Invoice not found");
    if (!PAYABLE_STATUSES.has(job.status)) {
      throw new AppError(
        "validation-error",
        `Job ${validJobId} is not payable from status ${job.status}`,
        "This invoice is not available for payment.",
      );
    }

    const { total } = computeInvoiceTotals(job);
    const amountInCents = Math.round(total * 100);
    if (amountInCents <= 0) {
      throw new AppError(
        "validation-error",
        `Job ${validJobId} has non-positive invoice total`,
        "This invoice cannot be paid online.",
      );
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Service: ${job.service}`,
              description: `Invoice ${formatInvoiceNumber(job.invoiceNumber, validJobId)}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${validJobId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${validJobId}?canceled=true`,
      metadata: { jobId: validJobId },
    });
    return { success: true, url: session.url };
  } catch (error) {
    return handleServerActionError(error, "createCheckoutSession");
  }
}

export async function deleteJob(jobId: string) {
  await requireAdmin();
  try {
    validateId(jobId);
    await adminDb.collection("jobs").doc(jobId).delete();
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "deleteJob");
  }
}

async function getGeocode(address: string) {
  if (!address) return null;
  if (MOCK_GEOCODING) return { lat: 43.6532, lng: -79.3832 };
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0)
      return data.results[0].geometry.location;
    return null;
  } catch {
    return null;
  }
}
