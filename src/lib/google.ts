import "server-only";
import { google } from "googleapis";

// 1. Setup Google Auth
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

// 2. Function to Add Event
export async function addToGoogleCalendar(
    eventData: { title: string; description: string; location: string },
    date: string
) {
    const calendarId = process.env.GOOGLE_CALENDAR_ID; // muhammadbinuc@gmail.com

    if (!calendarId) {
        throw new Error("Missing GOOGLE_CALENDAR_ID in .env");
    }

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
        console.error("❌ Google Calendar Error:", error.message);
        // Determine if it's a permission issue
        if (error.message.includes("Writer access")) {
            throw new Error("Bot needs 'Make changes to events' permission on your Google Calendar.");
        }
        throw error;
    }
}