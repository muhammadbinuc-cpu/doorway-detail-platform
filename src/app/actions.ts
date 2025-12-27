"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
// Import the Calendar helper we just made
import { addToGoogleCalendar } from "@/lib/google";

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
            gateCode: "",
            referralSource: "",
            status: 'LEAD',
            totalSpent: 0,
            jobCount: 0,
            tags: [],
            createdAt: Timestamp.now(),
            lastServiceDate: null,
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

        // 1. Fetch Job Details needed for Calendar
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const jobSnap = await jobRef.get();

        if (!jobSnap.exists) {
            throw new Error("Job not found");
        }

        const job = jobSnap.data();

        // 2. Add to Google Calendar
        // We wrap this in a try/catch so if Calendar fails (e.g. invalid date),
        // we log it but don't crash the whole app.
        try {
            await addToGoogleCalendar({
                title: `Service: ${job?.name}`,
                description: `Service: ${job?.service}\nPhone: ${job?.phone}\nEmail: ${job?.email}\nAddress: ${job?.address}`,
                location: job?.address || "No Address Provided"
            }, date);
            console.log("✅ Added to Google Calendar");
        } catch (calError: any) {
            console.error("⚠️ Calendar Sync Warning:", calError.message);
            // Optional: You could return { success: false, error: "Calendar failed" } here if you want to be strict
        }

        // 3. Update Database Status
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

export async function updateJobStatus(jobId: string, newStatus: string) {
    try {
        await adminDb.collection("jobs").doc(jobId).update({
            status: newStatus,
            lastUpdated: Timestamp.now()
        });
        return { success: true };
    } catch (error: any) {
        console.error("❌ Update Status Error:", error);
        return { success: false, error: error.message };
    }
}

// --- QUOTE ACTIONS ---

export async function submitQuote(formData: any) {
    try {
        const { name, email, phone, address, service } = formData;
        const emailLower = email.toLowerCase();
        let clientId: string;

        // Check if client exists
        const clientsRef = adminDb.collection("clients");
        const q = await clientsRef.where("email", "==", emailLower).get();

        if (!q.empty) {
            clientId = q.docs[0].id;
            // Update last contact
            await q.docs[0].ref.update({ lastContactDate: Timestamp.now() });
        } else {
            // Create new client
            const newClient = await clientsRef.add({
                name, email: emailLower, phone, address,
                status: "LEAD", createdAt: Timestamp.now(),
                totalSpent: 0, jobCount: 0
            });
            clientId = newClient.id;
        }

        // Create the Job
        const newJob = await adminDb.collection("jobs").add({
            clientId, name, email: emailLower, phone, address, service,
            status: "LEAD_RECEIVED", createdAt: Timestamp.now()
        });

        return { success: true, jobId: newJob.id };
    } catch (error: any) {
        console.error("❌ Submit Quote Error:", error);
        return { success: false, error: error.message };
    }
}