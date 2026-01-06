"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import twilio from 'twilio';
import { ServiceLayer } from '@/lib/services';

const MOCK_GEOCODING = true;

const sanitizeKey = (key: string | undefined) => {
    if (!key) return undefined;
    return key.replace(/['"]/g, "").replace(/\\n/g, "\n");
};

const resendKey = sanitizeKey(process.env.RESEND_API_KEY);
const resend = resendKey ? new Resend(resendKey) : null;

const twilioSid = sanitizeKey(process.env.TWILIO_ACCOUNT_SID);
const twilioToken = sanitizeKey(process.env.TWILIO_AUTH_TOKEN);
const twilioClient = (twilioSid && twilioToken) ? twilio(twilioSid, twilioToken) : null;

// ✅ FIX 2: UNLOCKED WORKFLOW (Full Flexibility)
// You can now move ANY job to ANY status if you need to fix a mistake.
const JOB_WORKFLOW: Record<string, string[]> = {
    'LEAD_RECEIVED': ['SCHEDULED', 'LOST', 'CANCELLED', 'COMPLETED', 'INVOICED'],
    'SCHEDULED': ['INVOICED', 'CANCELLED', 'COMPLETED', 'LEAD_RECEIVED'],
    'COMPLETED': ['INVOICED', 'SCHEDULED', 'PAID'], // Allow jumping to Paid
    'INVOICED': ['PAID', 'UNPAID', 'COMPLETED', 'SCHEDULED'], // Allow fixing invoice by going back
    'PAID': ['INVOICED', 'COMPLETED'], // Allow undoing payment
    'LOST': ['LEAD_RECEIVED'],
    'CANCELLED': ['LEAD_RECEIVED', 'SCHEDULED']
};

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

export async function createSession() {
    const secret = sanitizeKey(process.env.ADMIN_SECRET);
    if (!secret) throw new Error("ADMIN_SECRET is missing in Vercel.");
    (await cookies()).set('session_token_v2', secret, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400, path: '/' });
    return { success: true };
}

export async function loginAdmin(formData: FormData) {
    const password = formData.get('password');
    const secret = sanitizeKey(process.env.ADMIN_SECRET);
    if (password === secret) {
        (await cookies()).set('session_token_v2', secret!, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400, path: '/' });
        return { success: true };
    }
    return { success: false, error: "Invalid Password" };
}

export async function createClient(clientData: any) {
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
    try {
        await adminDb.collection("clients").doc(clientId).delete();
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateClientNotes(clientId: string, notes: string) {
    try {
        await adminDb.collection("clients").doc(clientId).update({ propertyNotes: notes, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createJobFromClient(clientId: string) {
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
    try {
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job) throw new Error("Job not found");
        // We removed the strict warning check so you can move freely
        await jobRef.update({ status: newStatus, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function confirmBooking(jobId: string, date: string) {
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
                // Check if this is a RESCHEDULE
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
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

// ✅ FIX 1: FORCE NUMBERS (Discount/Tax Bug)
export async function updateJobDetails(jobId: string, data: any) {
    try {
        const cleanData = { ...data };
        // Force conversion to numbers if these fields exist
        if (cleanData.discount !== undefined) cleanData.discount = Number(cleanData.discount);
        if (cleanData.taxRate !== undefined) cleanData.taxRate = Number(cleanData.taxRate);
        if (cleanData.price !== undefined) cleanData.price = Number(cleanData.price);

        await adminDb.collection("jobs").doc(jobId).update({ ...cleanData, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function emailInvoice(jobId: string) {
    try {
        if (!resend) throw new Error("CRITICAL: RESEND_API_KEY is missing or invalid.");
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job?.email) throw new Error("No email found");

        await ServiceLayer.logEvent('INVOICE_SENT', { jobId, email: job.email });

        // Ensure numbers are numbers for calculation
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
                    <table align="center" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin: 0 auto;">
                        <tr><td style="background-color: #000000; padding: 40px; text-align: center;"><h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0; text-transform: uppercase;">DOORWAY <span style="color: #D4AF37;">DETAIL</span></h1><p style="color: #888888; font-size: 12px; margin-top: 10px; font-weight: bold;">PREMIUM HOME SERVICES</p></td></tr>
                        <tr><td style="padding: 40px;"><h2 style="margin-top: 0; color: #000000; font-size: 28px; font-weight: 800;">Invoice Ready</h2><p style="color: #555555; font-size: 16px; line-height: 1.6;">Hi ${job.name},</p><p style="color: #555555; font-size: 16px; line-height: 1.6;">Thank you for choosing DoorWay Detail. Your invoice for <strong>${job.service || 'Window Cleaning'}</strong> is ready.</p>
                                <table width="100%" style="margin: 30px 0; border-collapse: collapse; background-color: #f9f9f9; border-radius: 8px;">
                                    <tr><td style="padding: 15px 20px; color: #888888; font-size: 14px;">Service</td><td style="padding: 15px 20px; text-align: right; font-weight: bold; color: #000000;">${job.service || 'Window Cleaning'}</td></tr>
                                    <tr style="border-top: 1px solid #eeeeee;"><td style="padding: 15px 20px; color: #888888; font-size: 14px;">Subtotal</td><td style="padding: 15px 20px; text-align: right; font-weight: bold; color: #000000;">$${subtotal.toFixed(2)}</td></tr>
                                    <tr style="border-top: 1px solid #eeeeee;"><td style="padding: 15px 20px; color: #888888; font-size: 14px;">Tax</td><td style="padding: 15px 20px; text-align: right; font-weight: bold; color: #000000;">$${taxAmount.toFixed(2)}</td></tr>
                                    <tr style="border-top: 2px solid #000000;"><td style="padding: 20px; color: #000000; font-size: 16px; font-weight: 800;">TOTAL DUE</td><td style="padding: 20px; text-align: right; font-weight: 900; font-size: 24px; color: #D4AF37;">$${total.toFixed(2)}</td></tr>
                                </table>
                                <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;"><a href="https://doorway-detail-platform.vercel.app/invoice/${jobId}" style="background-color: #000000; color: #D4AF37; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">PAY INVOICE &rarr;</a></div><p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">Secure payment powered by Stripe</p></td></tr>
                        <tr><td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;"><p style="color: #888888; font-size: 12px; margin: 0; line-height: 1.5;"><strong>DoorWay Detail</strong><br>Oakville, ON | 289-772-5757<br><a href="mailto:admin@doorwaydetail.com" style="color: #D4AF37; text-decoration: none;">Contact Support</a></p></td></tr>
                    </table>
                </body>
                </html>
            `
        });
        if (error) { console.error("Resend Error:", error); throw new Error(error.message); }
        if (job.phone && twilioClient) {
            try { await twilioClient.messages.create({ body: `Hi ${job.name}, your DoorWay Detail invoice is ready. Please check your email.`, from: process.env.TWILIO_FROM_NUMBER, to: job.phone }); } catch (e) { console.error("SMS notification failed:", e); }
        }
        await jobRef.update({ status: 'INVOICED', lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

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

export async function sendOnMyWay(jobId: string) {
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
    try {
        const originalJob = (await adminDb.collection("jobs").doc(originalJobId).get()).data();
        if (!originalJob) throw new Error("Original job not found");
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        const newJob = await adminDb.collection("jobs").add({ ...originalJob, status: "LEAD_RECEIVED", createdAt: Timestamp.now(), scheduledDate: null, service: originalJob.service + " (Recurring)", price: originalJob.price });
        return { success: true, jobId: newJob.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}