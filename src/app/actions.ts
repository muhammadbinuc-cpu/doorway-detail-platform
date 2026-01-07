"use server";

import { revalidatePath } from "next/cache";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import twilio from 'twilio';
import { ServiceLayer } from '@/lib/services';

const MOCK_GEOCODING = true;

// --- SECURITY HELPERS ---

const sanitizeKey = (key: string | undefined) => {
    if (!key) return undefined;
    return key.replace(/['"]/g, "").replace(/\\n/g, "\n");
};

/**
 * 🔒 GATEKEEPER FUNCTION
 * Checks for the valid session cookie.
 */
async function requireAdmin() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session_token_v2');
    const secret = sanitizeKey(process.env.ADMIN_SECRET);
    
    if (!secret) throw new Error("Internal: ADMIN_SECRET missing");
    if (!session || session.value !== secret) {
        throw new Error("⛔ UNAUTHORIZED: Access Denied.");
    }
}

// --- NEW AUTH FUNCTION ---

/**
 * ✅ VERIFY FIREBASE TOKEN (The Bridge)
 * This exchanges a valid Firebase ID Token for our internal Admin Cookie.
 */
export async function verifyFirebaseLogin(idToken: string) {
    try {
        // 1. Verify the token with Firebase Admin SDK
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        // 2. If verification passes, create the session
        const secret = sanitizeKey(process.env.ADMIN_SECRET);
        if (!secret) throw new Error("ADMIN_SECRET missing");

        (await cookies()).set('session_token_v2', secret, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 86400, 
            path: '/' 
        });

        return { success: true, email: decodedToken.email };
    } catch (error: any) {
        console.error("Auth Verification Failed:", error);
        return { success: false, error: "Invalid Token" };
    }
}

// --- INITIALIZATION ---

const resendKey = sanitizeKey(process.env.RESEND_API_KEY);
const resend = resendKey ? new Resend(resendKey) : null;

const twilioSid = sanitizeKey(process.env.TWILIO_ACCOUNT_SID);
const twilioToken = sanitizeKey(process.env.TWILIO_AUTH_TOKEN);
const twilioClient = (twilioSid && twilioToken) ? twilio(twilioSid, twilioToken) : null;

// --- PUBLIC ACTIONS ---

export async function submitQuote(formData: any) {
    try {
        const { name, email, phone, address, service } = formData;
        const emailLower = email.toLowerCase();
        await ServiceLayer.logEvent('QUOTE_SUBMITTED', { email: emailLower });
        let clientId: string;
        const q = await adminDb.collection("clients").where("email", "==", emailLower).get();
        if (!q.empty) {
            clientId = q.docs[0].id;
            await adminDb.collection("clients").doc(clientId).update({ name, phone, address, lastUpdated: Timestamp.now() });
        } else {
            const coords = await getGeocode(address);
            const newClient = await adminDb.collection("clients").add({ name, email: emailLower, phone, address, geolocation: coords || { lat: 0, lng: 0 }, status: "LEAD", createdAt: Timestamp.now() });
            clientId = newClient.id;
        }
        const newJob = await adminDb.collection("jobs").add({ clientId, name, email: emailLower, phone, address, service, status: "LEAD_RECEIVED", createdAt: Timestamp.now() });
        return { success: true, jobId: newJob.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// --- PROTECTED ACTIONS ---

export async function createClient(clientData: any) {
    await requireAdmin();
    try {
        const coordinates = await getGeocode(clientData.address);
        const newClient = await adminDb.collection("clients").add({
            ...clientData,
            email: clientData.email.toLowerCase(),
            geolocation: coordinates || { lat: 0, lng: 0 },
            status: 'LEAD',
            createdAt: Timestamp.now(),
        });
        return { success: true, clientId: newClient.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteClient(clientId: string) {
    await requireAdmin();
    try {
        await adminDb.collection("clients").doc(clientId).delete();
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateClientNotes(clientId: string, notes: string) {
    await requireAdmin();
    try {
        await adminDb.collection("clients").doc(clientId).update({ propertyNotes: notes, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createJobFromClient(clientId: string) {
    await requireAdmin();
    try {
        const client = (await adminDb.collection("clients").doc(clientId).get()).data();
        if (!client) throw new Error("Client missing");
        const res = await adminDb.collection("jobs").add({
            clientId,
            name: client.name, email: client.email, phone: client.phone, address: client.address,
            service: "Window Cleaning",
            status: "LEAD_RECEIVED",
            createdAt: Timestamp.now(),
            price: 0
        });
        return { success: true, jobId: res.id };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateJobStatus(jobId: string, newStatus: string) {
    await requireAdmin();
    try {
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job) throw new Error("Job not found");
        await jobRef.update({ status: newStatus, lastUpdated: Timestamp.now() });
        revalidatePath("/admin"); // Ensuring admin list refreshes
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function confirmBooking(jobId: string, date: string) {
    await requireAdmin();
    try {
        await ServiceLayer.logEvent('BOOKING_CONFIRMED', { jobId, date });
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job) throw new Error("Job not found");

        try {
            await addToGoogleCalendar({
                title: `Service: ${job.name}`, description: `Phone: ${job.phone}`, location: job.address
            }, date);
        } catch (e) { console.error("Cal Error:", e); }

        if (job.phone && twilioClient) {
            try {
                const dateStr = new Date(date).toLocaleDateString();
                const msg = job.status === 'SCHEDULED'
                    ? `Hi ${job.name}, your DoorWay Detail appointment has been RESCHEDULED to ${dateStr}.`
                    : `Hi ${job.name}, DoorWay Detail confirmed your appointment for ${dateStr}.`;

                await twilioClient.messages.create({
                    body: msg,
                    from: process.env.TWILIO_FROM_NUMBER, to: job.phone
                });
            } catch (e) { console.error("SMS Failed:", e); }
        }

        await jobRef.update({ status: 'SCHEDULED', scheduledDate: date, lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateJobDetails(jobId: string, data: any) {
    await requireAdmin();
    try {
        const cleanData = { ...data };
        if (cleanData.discount !== undefined) cleanData.discount = Number(cleanData.discount);
        if (cleanData.taxRate !== undefined) cleanData.taxRate = Number(cleanData.taxRate);
        if (cleanData.price !== undefined) cleanData.price = Number(cleanData.price);

        await adminDb.collection("jobs").doc(jobId).update({ ...cleanData, lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function emailInvoice(jobId: string) {
    await requireAdmin();
    try {
        if (!resend) throw new Error("CRITICAL: RESEND_API_KEY is missing or invalid.");
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job?.email) throw new Error("No email found");

        await ServiceLayer.logEvent('INVOICE_SENT', { jobId, email: job.email });

        const price = Number(job.price) || 0;
        const discount = Number(job.discount) || 0;
        const subtotal = price - discount;
        const taxRate = Number(job.taxRate) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        const { data, error } = await resend.emails.send({
            from: 'DoorWay Detail <onboarding@resend.dev>',
            to: job.email,
            subject: `Invoice #${jobId.slice(0, 6).toUpperCase()} from DoorWay Detail`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 40px 0;">
                    <p>Hi ${job.name},</p>
                    <p>Total Due: <strong>$${total.toFixed(2)}</strong></p>
                    <p><a href="https://doorway-detail-platform.vercel.app/invoice/${jobId}">Pay Now</a></p>
                </body>
                </html>
            `
        });
        if (error) { console.error("Resend Error:", error); throw new Error(error.message); }
        
        if (job.phone && twilioClient) {
            try { await twilioClient.messages.create({ body: `Hi ${job.name}, your DoorWay Detail invoice is ready. Please check your email.`, from: process.env.TWILIO_FROM_NUMBER, to: job.phone }); } catch (e) { console.error("SMS notification failed:", e); }
        }
        await jobRef.update({ status: 'INVOICED', lastUpdated: Timestamp.now() });
        revalidatePath("/admin");
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function sendOnMyWay(jobId: string) {
    await requireAdmin();
    try {
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job || !job.phone) throw new Error("Job or phone missing");
        await ServiceLayer.logEvent('ON_MY_WAY_SENT', { jobId });
        if (twilioClient) {
            await twilioClient.messages.create({ body: `🚗 Hi ${job.name}, DoorWay Detail is on the way! We will arrive in approximately 20-30 minutes.`, from: process.env.TWILIO_FROM_NUMBER, to: job.phone });
            return { success: true };
        } else { console.log("MOCK SMS: On My Way sent to " + job.phone); return { success: true, mocked: true }; }
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createRecurringJob(originalJobId: string) {
    await requireAdmin();
    try {
        const originalJob = (await adminDb.collection("jobs").doc(originalJobId).get()).data();
        if (!originalJob) throw new Error("Original job not found");
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        const newJob = await adminDb.collection("jobs").add({ ...originalJob, status: "LEAD_RECEIVED", createdAt: Timestamp.now(), scheduledDate: null, service: originalJob.service + " (Recurring)", price: originalJob.price });
        revalidatePath("/admin");
        return { success: true, jobId: newJob.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}

async function getGeocode(address: string) {
    if (!address) return null;
    if (MOCK_GEOCODING) return { lat: 43.6532, lng: -79.3832 };
    try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { lat, lng };
        }
        return null;
    } catch (error) { return null; }
}

// --- NEW SECURE FUNCTIONS FOR OPTION B ---

/**
 * Securely marks an invoice as PAID.
 * Logic runs on the server, bypassing client-side rules.
 */
export async function markInvoicePaid(jobId: string) {
    // No admin check here because ANYONE (the customer) needs to be able to pay
    if (!jobId) throw new Error("No Job ID provided");

    try {
        await adminDb.collection("jobs").doc(jobId).update({
            status: "PAID",
            paidAt: Timestamp.now(), 
        });

        // Refresh the invoice page so the user sees "PAID" instantly
        revalidatePath(`/invoice/${jobId}`);
        revalidatePath(`/admin`); 
        
        return { success: true };
    } catch (error: any) {
        console.error("Failed to mark paid:", error);
        return { success: false, error: "Failed to update payment status." };
    }
}

/**
 * Securely deletes a job.
 * strictly for Admins.
 */
export async function deleteJob(jobId: string) {
    await requireAdmin(); // 🔒 Security Check

    try {
        await adminDb.collection("jobs").doc(jobId).delete();
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete job:", error);
        return { success: false, error: "Delete failed." };
    }
}