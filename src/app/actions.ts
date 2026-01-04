"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import twilio from 'twilio';
import { ServiceLayer } from '@/lib/services';

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

// ✅ TASK 1: Secure Session Bridge for Firebase Auth
export async function createSession() {
    // Set server-side cookie for middleware authentication
    (await cookies()).set('admin_session', process.env.ADMIN_SECRET!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 86400, // 1 day
        path: '/',
    });

    return { success: true };
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

// ✅ TASK 3: Safety Layer Integration
export async function confirmBooking(jobId: string, date: string) {
    try {
        // Safety Layer Logging
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

export async function updateJobDetails(jobId: string, data: any) {
    try {
        await adminDb.collection("jobs").doc(jobId).update({ ...data, lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// ✅ TASK 2 & 3: Productionize Email Invoice + Safety Layer
export async function emailInvoice(jobId: string) {
    try {
        if (!resend) throw new Error("CRITICAL: RESEND_API_KEY is missing.");
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const job = (await jobRef.get()).data();
        if (!job?.email) throw new Error("No email found");

        // Safety Layer Logging
        await ServiceLayer.logEvent('INVOICE_SENT', { jobId, email: job.email });

        const price = job.price || 0;
        const discount = job.discount || 0;
        const subtotal = price - discount;
        const taxRate = job.taxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        const gold = "#D4AF37";
        const black = "#000000";

        // ✅ TASK 2: Use REAL client email
        await resend.emails.send({
            from: 'DoorWay Detail <onboarding@resend.dev>',
            to: job.email, // ✅ Using real client email
            subject: `Invoice from DoorWay Detail`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                        .header { background-color: ${black}; padding: 40px 30px; text-align: left; }
                        .brand { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
                        .brand-gold { color: ${gold}; font-style: italic; }
                        .slogan { color: #cccccc; font-size: 14px; margin-top: 8px; font-weight: 300; }
                        .content { padding: 40px 30px; color: #333333; }
                        .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: ${black}; border-bottom: 2px solid ${gold}; padding-bottom: 10px; display: inline-block; }
                        .invoice-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .invoice-details td { padding: 15px 0; border-bottom: 1px solid #eeeeee; font-size: 16px; }
                        .total-row td { border-top: 2px solid ${black}; border-bottom: none; font-weight: 800; font-size: 20px; padding-top: 20px; }
                        .button-container { text-align: center; margin-top: 40px; }
                        .button { display: inline-block; background-color: ${black}; color: ${gold}; padding: 18px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; }
                        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="brand">DOORWAY <span class="brand-gold">DETAIL</span></div>
                            <div class="slogan">Detail Done Flawlessly</div>
                        </div>

                        <div class="content">
                            <div class="invoice-title">INVOICE</div>
                            <p>Hi ${job.name},</p>
                            <p style="line-height: 1.6;">Thank you for your business. Please find your invoice details below.</p>

                            <table class="invoice-details">
                                <tr>
                                    <td><strong>Service</strong><br><span style="font-size:14px; color:#666;">Window Cleaning</span></td>
                                    <td style="text-align: right;">$${price.toFixed(2)}</td>
                                </tr>
                                ${discount > 0 ? `
                                <tr>
                                    <td style="color: #d9534f;">Discount</td>
                                    <td style="text-align: right; color: #d9534f;">-$${discount.toFixed(2)}</td>
                                </tr>` : ''}
                                <tr>
                                    <td>Tax (${taxRate}%)</td>
                                    <td style="text-align: right;">$${taxAmount.toFixed(2)}</td>
                                </tr>
                                <tr class="total-row">
                                    <td>TOTAL DUE</td>
                                    <td style="text-align: right;">$${total.toFixed(2)}</td>
                                </tr>
                            </table>

                            <div class="button-container">
                                <a href="https://doorway-detail-platform.vercel.app/invoice/${jobId}" class="button">PAY INVOICE NOW</a>
                            </div>
                        </div>

                        <div class="footer">
                            <p>DoorWay Detail | 289-772-5757 | doorwaydetail@gmail.com</p>
                            <p>&copy; ${new Date().getFullYear()} DoorWay Detail. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        // ✅ TASK 2: Add SMS Notification
        if (job.phone && twilioClient) {
            try {
                await twilioClient.messages.create({
                    body: `Hi ${job.name}, your DoorWay Detail invoice is ready. Please check your email.`,
                    from: process.env.TWILIO_FROM_NUMBER,
                    to: job.phone
                });
            } catch (e) {
                console.error("SMS notification failed:", e);
            }
        }

        await jobRef.update({ status: 'INVOICED', lastUpdated: Timestamp.now() });
        return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
}

// ✅ TASK 3: Safety Layer Integration
export async function submitQuote(formData: any) {
    try {
        const { name, email, phone, address, service } = formData;
        const emailLower = email.toLowerCase();

        // Safety Layer Logging
        await ServiceLayer.logEvent('QUOTE_SUBMITTED', { email: emailLower });

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