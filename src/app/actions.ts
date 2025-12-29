"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { addToGoogleCalendar } from "@/lib/google";
import { cookies } from 'next/headers';
// Note: If you haven't installed 'resend' or 'twilio' yet, these imports might show warnings.
// You can comment them out until you run 'npm install resend twilio'
// import { Resend } from 'resend'; 
// import twilio from 'twilio'; 

// --- SECURITY ACTION (New) ---
export async function loginAdmin(formData: FormData) {
    const password = formData.get('password');

    // Check against the secret you saved in Vercel
    if (password === process.env.ADMIN_SECRET) {
        (await cookies()).set('admin_session', process.env.ADMIN_SECRET!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 Day
            path: '/',
        });
        return { success: true };
    }
    return { success: false, error: "Invalid Password" };
}

// --- CLIENT ACTIONS ---

export async function createClient(clientData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    propertyNotes?: string;
}) {
    try {
        console.log("Creating Client:", clientData.email);
        const newClient = await adminDb.collection("clients").add({
            name: clientData.name,
            email: clientData.email.toLowerCase(),
            phone: clientData.phone,
            address: clientData.address,
            propertyNotes: clientData.propertyNotes || "",
            status: 'LEAD',
            totalSpent: 0,
            createdAt: Timestamp.now(),
            lastContactDate: Timestamp.now()
        });
        return { success: true, clientId: newClient.id };
    } catch (error: any) {
        console.error("❌ Create Client Error:", error);
        return { success: false, error: error.message };
    }
}

// --- JOB ACTIONS ---

export async function createJobFromClient(clientId: string) {
    try {
        const clientRef = adminDb.collection("clients").doc(clientId);
        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) throw new Error("Client not found");
        const client = clientSnap.data();

        const newJob = await adminDb.collection("jobs").add({
            clientId: clientId,
            name: client?.name,
            email: client?.email,
            phone: client?.phone,
            address: client?.address,
            service: "Window Cleaning",
            status: "LEAD_RECEIVED",
            createdAt: Timestamp.now(),
            price: 0
        });
        return { success: true, jobId: newJob.id };
    } catch (error: any) {
        console.error("❌ Create Job Error:", error);
        return { success: false, error: error.message };
    }
}

export async function confirmBooking(jobId: string, date: string) {
    try {
        console.log(`🚀 Booking Job: ${jobId}`);

        const jobRef = adminDb.collection("jobs").doc(jobId);
        const jobSnap = await jobRef.get();
        if (!jobSnap.exists) throw new Error("Job not found");
        const job = jobSnap.data();

        // 1. Google Calendar
        try {
            await addToGoogleCalendar({
                title: `Service: ${job?.name}`,
                description: `Service: ${job?.service}\nPhone: ${job?.phone}`,
                location: job?.address || "No Address"
            }, date);
        } catch (e) {
            console.error("Calendar Error (Non-fatal):", e);
        }

        // 2. Update Database
        await jobRef.update({
            status: 'SCHEDULED',
            scheduledDate: date,
            lastUpdated: Timestamp.now()
        });

        return { success: true };
    } catch (error: any) {
        console.error("❌ Booking Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateJobStatus(jobId: string, status: string) {
    try {
        console.log(`Updating Job ${jobId} status to ${status}`);
        await adminDb.collection("jobs").doc(jobId).update({
            status: status,
            lastUpdated: Timestamp.now()
        });
        return { success: true };
    } catch (error: any) {
        console.error("❌ Update Job Status Error:", error);
        return { success: false, error: error.message };
    }
}

// --- QUOTE ACTIONS ---

export async function submitQuote(formData: any) {
    try {
        const { name, email, phone, address, service } = formData;
        const emailLower = email.toLowerCase();
        let clientId: string;

        const clientsRef = adminDb.collection("clients");
        const q = await clientsRef.where("email", "==", emailLower).get();

        if (!q.empty) {
            clientId = q.docs[0].id;
            await q.docs[0].ref.update({ lastContactDate: Timestamp.now() });
        } else {
            const newClient = await clientsRef.add({
                name, email: emailLower, phone, address,
                status: "LEAD", createdAt: Timestamp.now(),
                totalSpent: 0
            });
            clientId = newClient.id;
        }

        const newJob = await adminDb.collection("jobs").add({
            clientId, name, email: emailLower, phone, address, service,
            status: "LEAD_RECEIVED", createdAt: Timestamp.now()
        });

        return { success: true, jobId: newJob.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}