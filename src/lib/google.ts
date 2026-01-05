import "server-only";
import { google } from "googleapis";

// 1. SAFE KEY EXTRACTION
// We strip quotes and fix newlines, just like we did for Firebase
const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
const cleanKey = rawKey.replace(/['"]/g, "").replace(/\\n/g, "\n");

// 2. Initialize Auth (Lazy/Safe)
const getAuth = () => {
    // If keys are missing, throw a clear error instead of crashing blindly
    if (!process.env.GOOGLE_CLIENT_EMAIL || !cleanKey) {
        console.error("⚠️ GOOGLE CALENDAR WARNING: Missing credentials.");
        return null;
    }

    try {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: cleanKey,
            },
            scopes: ["https://www.googleapis.com/auth/calendar"],
        });
    } catch (e) {
        console.error("❌ Google Auth Init Failed:", e);
        return null;
    }
};

// 3. Function to Add Event
export async function addToGoogleCalendar(
    eventData: { title: string; description: string; location: string },
    date: string
) {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const auth = getAuth();

    if (!calendarId || !auth) {
        console.warn("⚠️ Skipping Calendar Event: Missing ID or Auth");
        return null; // Return null instead of crashing
    }

    const calendar = google.calendar({ version: "v3", auth });

    // Calculate End Time (1 hour later)
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    try {
        const response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: {
                summary: eventData.title,
                description: eventData.description,
                location: eventData.location,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() },
            },
        });

        console.log("✅ Google Calendar Event Created:", response.data.htmlLink);
        return response.data;
    } catch (error: any) {
        console.error("❌ Google Calendar API Error:", error.message);
        // We catch the error so it doesn't crash the whole login flow
        return null;
    }
}