"use server";

// 🔒 ============================================
// 🔒 SECURE SERVER ACTIONS - Doorway Detail SaaS
// 🔒 ============================================

import { revalidatePath } from "next/cache";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import twilio from 'twilio';
import { ServiceLayer } from '@/lib/services';
import Stripe from 'stripe';
import { ZodError } from 'zod';
import InvoiceEmail from "@/components/email/InvoiceEmail"; // <--- ADDED IMPORT

// 🔒 Security imports
import { handleServerActionError, createFsmError, AppError } from '@/lib/errors';
import {
    validateQuote,
    validateJobUpdate,
    validateClient,
    validateId,
    validateBooking,
} from '@/lib/validation';
import { enforceRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { isValidTransition, JOB_WORKFLOW } from '@/lib/fsm_logic';
import { sanitizeKey } from '@/lib/key-utils';

const MOCK_GEOCODING = process.env.MOCK_GEOCODING !== 'false';
const SESSION_COOKIE_NAME = '__session';
const SESSION_COOKIE_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const PAYABLE_STATUSES = new Set(["INVOICED", "UNPAID"]);

function getErrorCode(error: unknown): string {
    return error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
}

// --- STRIPE INIT ---
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new AppError('config-error', 'STRIPE_SECRET_KEY is undefined', 'Payment service unavailable');
        _stripe = new Stripe(key, { apiVersion: '2025-12-15.clover' });
    }
    return _stripe;
}

// --- EMAIL/SMS INIT ---
let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        const key = sanitizeKey(process.env.RESEND_API_KEY);
        if (!key) throw new AppError('config-error', 'RESEND_API_KEY missing', 'Email service not configured');
        _resend = new Resend(key);
    }
    return _resend;
}

let _twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient(): ReturnType<typeof twilio> {
    if (!_twilioClient) {
        const sid = sanitizeKey(process.env.TWILIO_ACCOUNT_SID);
        const token = sanitizeKey(process.env.TWILIO_AUTH_TOKEN);
        if (!sid || !token) throw new AppError('config-error', 'Twilio credentials missing', 'SMS service not configured');
        _twilioClient = twilio(sid, token);
    }
    return _twilioClient;
}

// 🔒 Secure session verification
async function requireAdmin() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) throw new AppError('unauthorized', 'No session cookie', 'Access denied.');
    try {
        await adminAuth.verifySessionCookie(sessionCookie.value, true);
    } catch (error) {
        throw new AppError('unauthorized', `Session invalid: ${getErrorCode(error)}`, 'Session expired.');
    }
}

// ============================================
// 🔒 AUTH ACTIONS
// ============================================
export async function verifyFirebaseLogin(idToken: string) {
    try {
        await enforceRateLimit('login');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_EXPIRES_MS });
        (await cookies()).set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: SESSION_COOKIE_EXPIRES_MS / 1000, path: '/'
        });
        resetRateLimit('login', decodedToken.email || decodedToken.uid);
        return { success: true, email: decodedToken.email };
    } catch (error) {
        return handleServerActionError(error, 'verifyFirebaseLogin');
    }
}

export async function revokeSession() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
        if (sessionCookie?.value) {
            try {
                const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value);
                await adminAuth.revokeRefreshTokens(decodedClaims.uid);
            } catch { }
        }
        (await cookies()).delete(SESSION_COOKIE_NAME);
        return { success: true };
    } catch (error) {
        return handleServerActionError(error, 'revokeSession');
    }
}

// ============================================
// 🔒 PUBLIC ACTIONS
// ============================================
export async function submitQuote(formData: unknown) {
    try {
        await enforceRateLimit('quote');
        const { name, email, phone, address, service } = validateQuote(formData);
        await ServiceLayer.logEvent('QUOTE_SUBMITTED', { email });

        let clientId: string;
        const q = await adminDb.collection("clients").where("email", "==", email).get();

        if (!q.empty) {
            clientId = q.docs[0].id;
            await adminDb.collection("clients").doc(clientId).update({ name, phone, address, lastUpdated: Timestamp.now() });
        } else {
            const coords = await getGeocode(address);
            const newClient = await adminDb.collection("clients").add({
                name, email, phone, address, geolocation: coords || { lat: 0, lng: 0 }, status: "LEAD", createdAt: Timestamp.now()
            });
            clientId = newClient.id;
        }

        const newJob = await adminDb.collection("jobs").add({
            clientId, name, email, phone, address, service, status: "LEAD_RECEIVED", createdAt: Timestamp.now()
        });

        return { success: true, jobId: newJob.id };
    } catch (error) {
        if (error instanceof ZodError) return { success: false, error: error.issues[0].message };
        return handleServerActionError(error, 'submitQuote');
    }
}

// ============================================
// 🔒 PROTECTED ADMIN ACTIONS
// ============================================
export async function createClient(clientData: unknown) {
    await requireAdmin();
    try {
        const validated = validateClient(clientData);
        const coordinates = await getGeocode(validated.address);
        const newClient = await adminDb.collection("clients").add({
            ...validated, propertyNotes: validated.propertyNotes || '', geolocation: coordinates || { lat: 0, lng: 0 }, status: 'LEAD', createdAt: Timestamp.now(),
        });
        return { success: true, clientId: newClient.id };
    } catch (error) {
        if (error instanceof ZodError) return { success: false, error: error.issues[0].message };
        return handleServerActionError(error, 'createClient');
    }
}

export async function deleteClient(clientId: string) {
    await requireAdmin();
    try {
        validateId(clientId);
        await adminDb.collection("clients").doc(clientId).delete();
        return { success: true };
    } catch (error) {
        return handleServerActionError(error, 'deleteClient');
    }
}

export async function updateClientNotes(clientId: string, notes: string) {
    await requireAdmin();
    try {
        validateId(clientId);
        const sanitizedNotes = notes.trim().slice(0, 2000).replace(/<[^>]*>/g, '');
        await adminDb.collection("clients").doc(clientId).update({ propertyNotes: sanitizedNotes, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error) {
        return handleServerActionError(error, 'updateClientNotes');
    }
}

export async function createJobFromClient(clientId: string) {
    await requireAdmin();
    try {
        validateId(clientId);
        const client = (await adminDb.collection("clients").doc(clientId).get()).data();
        if (!client) throw new AppError('not-found', `Client ${clientId} not found`, 'Client not found');

        const res = await adminDb.collection("jobs").add({
            clientId, name: client.name, email: client.email, phone: client.phone, address: client.address, service: "Window Cleaning", status: "LEAD_RECEIVED", createdAt: Timestamp.now(), price: 0
        });
        return { success: true, jobId: res.id };
    } catch (error) {
        return handleServerActionError(error, 'createJobFromClient');
    }
}

export async function updateJobStatus(jobId: string, newStatus: string) {
    await requireAdmin();
    try {
        validateId(jobId);
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job) throw new AppError('not-found', `Job ${jobId} not found`, 'Job not found');

        if (!isValidTransition(job.status, newStatus)) {
            await ServiceLayer.logEvent('FSM_VIOLATION', { jobId, from: job.status, to: newStatus });
            throw createFsmError(job.status, newStatus, JOB_WORKFLOW[job.status] || []);
        }

        await jobRef.update({ status: newStatus, lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return handleServerActionError(error, 'updateJobStatus');
    }
}

export async function confirmBooking(jobId: string, date: string) {
    await requireAdmin();
    try {
        const validated = validateBooking(jobId, date);
        await ServiceLayer.logEvent('BOOKING_CONFIRMED', { jobId: validated.jobId, date: validated.date });
        const jobRef = adminDb.collection("jobs").doc(validated.jobId);
        const job = (await jobRef.get()).data();
        if (!job) throw new AppError('not-found', `Job not found`, 'Job not found');

        try { await addToGoogleCalendar({ title: `Service: ${job.name}`, description: `Phone: ${job.phone}`, location: job.address }, validated.date); } catch (e) { console.error("Calendar sync failed:", e); }

        if (job.phone) {
            try {
                const twilio = getTwilioClient();
                const dateStr = new Date(validated.date).toLocaleDateString();
                const msg = job.status === 'SCHEDULED' ? `Hi ${job.name}, rescheduled to ${dateStr}.` : `Hi ${job.name}, confirmed for ${dateStr}.`;
                await twilio.messages.create({ body: msg, from: process.env.TWILIO_FROM_NUMBER, to: job.phone });
            } catch (e) { console.error("SMS failed:", e); }
        }

        await jobRef.update({ status: 'SCHEDULED', scheduledDate: validated.date, lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        if (error instanceof ZodError) return { success: false, error: error.issues[0].message };
        return handleServerActionError(error, 'confirmBooking');
    }
}

export async function updateJobDetails(jobId: string, data: unknown) {
    await requireAdmin();
    try {
        validateId(jobId);
        const validated = validateJobUpdate(data);
        await adminDb.collection("jobs").doc(jobId).update({ ...validated, lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        if (error instanceof ZodError) return { success: false, error: error.issues[0].message };
        return handleServerActionError(error, 'updateJobDetails');
    }
}

/**
 * 🔒 Send invoice email to customer
 */
export async function emailInvoice(jobId: string) {
    await requireAdmin();
    try {
        validateId(jobId);
        const resendClient = getResend();
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();

        if (!job?.email) throw new AppError('validation-error', 'No email on job', 'Customer email not found');
        await ServiceLayer.logEvent('INVOICE_SENT', { jobId, email: job.email });

        const price = Number(job.price) || 0;
        const discount = Number(job.discount) || 0;
        const subtotal = price - discount;
        const taxRate = Number(job.taxRate) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        // 🟢 UPDATED: Sending Professional React Email
        const { error } = await resendClient.emails.send({
            from: 'DoorWay Detail <onboarding@resend.dev>',
            to: job.email,
            subject: `Invoice #${jobId.slice(0, 6).toUpperCase()} from DoorWay Detail`,
            react: InvoiceEmail({
                clientName: job.name,
                service: job.service || 'Cleaning Service',
                amount: Number(total),
                invoiceUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${jobId}`,
                invoiceId: jobId,
            }),
        });

        if (error) {
            console.error('Resend Error:', error);
            throw new AppError('email-error', 'Failed to send email', JSON.stringify(error));
        }

        if (job.phone) {
            try {
                const twilio = getTwilioClient();
                await twilio.messages.create({ body: `Hi ${job.name}, your DoorWay Detail invoice is ready. Please check your email.`, from: process.env.TWILIO_FROM_NUMBER, to: job.phone });
            } catch (e) { console.error("SMS notification failed:", e); }
        }

        await jobRef.update({ status: 'INVOICED', lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return handleServerActionError(error, 'emailInvoice');
    }
}

export async function sendOnMyWay(jobId: string) {
    await requireAdmin();
    try {
        validateId(jobId);
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job || !job.phone) throw new AppError('validation-error', 'Job/Phone missing', 'Phone number not found');

        await ServiceLayer.logEvent('ON_MY_WAY_SENT', { jobId });
        const twilio = getTwilioClient();
        await twilio.messages.create({ body: `🚗 Hi ${job.name}, DoorWay Detail is on the way! ETA: 20-30 mins.`, from: process.env.TWILIO_FROM_NUMBER, to: job.phone });
        return { success: true };
    } catch (error) {
        return handleServerActionError(error, 'sendOnMyWay');
    }
}

export async function createRecurringJob(originalJobId: string) {
    await requireAdmin();
    try {
        validateId(originalJobId);
        const originalJob = (await adminDb.collection("jobs").doc(originalJobId).get()).data();
        if (!originalJob) throw new AppError('not-found', `Job not found`, 'Job not found');

        const newJob = await adminDb.collection("jobs").add({
            ...originalJob, status: "LEAD_RECEIVED", createdAt: Timestamp.now(), scheduledDate: null, service: originalJob.service + " (Recurring)", price: originalJob.price
        });
        revalidatePath("/admin");
        return { success: true, jobId: newJob.id };
    } catch (error) {
        return handleServerActionError(error, 'createRecurringJob');
    }
}

export async function createCheckoutSession(jobId: string) {
    try {
        const validJobId = validateId(jobId);
        const job = (await adminDb.collection("jobs").doc(validJobId).get()).data();
        if (!job) throw new AppError('not-found', `Job not found`, 'Invoice not found');
        if (!PAYABLE_STATUSES.has(job.status)) {
            throw new AppError('validation-error', `Job ${validJobId} is not payable from status ${job.status}`, 'This invoice is not available for payment.');
        }

        const price = Number(job.price) || 0;
        const discount = Number(job.discount) || 0;
        const taxRate = Number(job.taxRate) || 0;
        const total = (price - discount) * (1 + (taxRate / 100));
        const amountInCents = Math.round(total * 100);
        if (amountInCents <= 0) {
            throw new AppError('validation-error', `Job ${validJobId} has non-positive invoice total`, 'This invoice cannot be paid online.');
        }

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price_data: { currency: 'cad', product_data: { name: `Service: ${job.service}`, description: `Invoice #${validJobId.slice(0, 6).toUpperCase()}` }, unit_amount: amountInCents }, quantity: 1 }],
            mode: 'payment', success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${validJobId}?success=true`, cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${validJobId}?canceled=true`, metadata: { jobId: validJobId },
        });
        return { success: true, url: session.url };
    } catch (error) {
        return handleServerActionError(error, 'createCheckoutSession');
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
        return handleServerActionError(error, 'deleteJob');
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
        if (data.status === 'OK' && data.results.length > 0) return data.results[0].geometry.location;
        return null;
    } catch { return null; }
}
