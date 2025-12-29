"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import twilio from 'twilio';

const MOCK_GEOCODING = true;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// FSM Logic
const JOB_WORKFLOW: Record<string, string[]> = {
    'LEAD_RECEIVED': ['SCHEDULED', 'LOST', 'CANCELLED'],
    'SCHEDULED': ['INVOICED', 'CANCELLED', 'COMPLETED'],
    'COMPLETED': ['INVOICED'],
    'INVOICED': ['PAID', 'UNPAID'],
    'PAID': [],
    'LOST': [], 'CANCELLED': []
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

export async function loginAdmin(formData: FormData) {
    const password = formData.get('password');
    if (password === process.env.ADMIN_SECRET) {
        (await cookies()).set('admin_session', process.env.ADMIN_SECRET!, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24, path: '/',
        });
        return { success: true };
    }
    return { success: false, error: "Invalid Password" };
}

// --- CLIENTS ---
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

// --- JOBS ---
// ✅ RESTORED: The missing function to create jobs
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

        const validTransitions = JOB_WORKFLOW[job.status] || [];
        if (!validTransitions.includes(newStatus) && newStatus !== 'SCHEDULED') {
            console.warn(`⚠️ FSM WARNING: Invalid transition ${job.status} -> ${newStatus}`);
        }
        await jobRef.update({ status: newStatus, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function confirmBooking(jobId: string, date: string) {
    try {
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
                await twilioClient.messages.create({
                    body: `Hi ${job.name}, DoorWay Detail confirmed your appointment for ${dateStr}.`,
                    from: process.env.TWILIO_FROM_NUMBER, to: job.phone
                });
            } catch (e) { console.error("SMS Failed:", e); }
        }

        await jobRef.update({ status: 'SCHEDULED', scheduledDate: date, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

// ✅ NEW: Handles Price, Discount, Tax updates
export async function updateJobDetails(jobId: string, data: any) {
    try {
        await adminDb.collection("jobs").doc(jobId).update({ ...data, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function emailInvoice(jobId: string) {
    try {
        if (!resend) throw new Error("CRITICAL: RESEND_API_KEY is missing.");
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job?.email) throw new Error("No email found");

        // 🧮 MATH LOGIC: Calculates Total before sending
        const price = job.price || 0;
        const discount = job.discount || 0;
        const subtotal = price - discount;
        const taxRate = job.taxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        await resend.emails.send({
            from: 'DoorWay Detail <onboarding@resend.dev>',
            to: [job.email],
            subject: `Invoice from DoorWay Detail`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1>Invoice</h1>
                    <p>Hi ${job.name},</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">Service</td><td style="text-align:right;">$${price.toFixed(2)}</td></tr>
                        <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:red;">Discount</td><td style="text-align:right;color:red;">-$${discount.toFixed(2)}</td></tr>
                        <tr><td style="padding:8px;border-bottom:1px solid #ddd;">Tax (${taxRate}%)</td><td style="text-align:right;">$${taxAmount.toFixed(2)}</td></tr>
                        <tr><td style="padding:8px;font-weight:bold;">TOTAL</td><td style="text-align:right;font-weight:bold;">$${total.toFixed(2)}</td></tr>
                    </table>
                    <p style="margin-top:20px;font-style:italic;">"${job.invoiceNotes || ''}"</p>
                    <p style="margin-top:20px;"><a href="https://doorway-detail-platform.vercel.app/invoice/${jobId}">Pay Now</a></p>
                </div>
            `
        });
        await jobRef.update({ status: 'INVOICED', lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

export async function submitQuote(formData: any) {
    try {
        const { name, email, phone, address, service } = formData;
        const emailLower = email.toLowerCase();

        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentJobs = await adminDb.collection("jobs")
            .where("email", "==", emailLower).where("createdAt", ">", Timestamp.fromDate(tenMinsAgo)).get();
        if (!recentJobs.empty) return { success: true, message: "Quote already received." };

        let clientId: string;
        const q = await adminDb.collection("clients").where("email", "==", emailLower).get();
        if (!q.empty) clientId = q.docs[0].id;
        else {
            const coords = await getGeocode(address);
            const newClient = await adminDb.collection("clients").add({
                name, email: emailLower, phone, address,
                geolocation: coords || { lat: 0, lng: 0 },
                status: "LEAD", createdAt: Timestamp.now(),
            });
            clientId = newClient.id;
        }
        const newJob = await adminDb.collection("jobs").add({
            clientId, name, email: emailLower, phone, address, service,
            status: "LEAD_RECEIVED", createdAt: Timestamp.now()
        });
        return { success: true, jobId: newJob.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}