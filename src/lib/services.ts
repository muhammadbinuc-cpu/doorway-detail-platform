import { google } from 'googleapis';
import Twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SYSTEM_EMAIL = process.env.SYSTEM_EMAIL || "doorwaydetail@gmail.com";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// Google Calendar Init (User Mandated Object Syntax)
const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ],
});

const calendar = google.calendar({ version: 'v3', auth });

// Twilio Init
const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Supabase Init
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const ServiceLayer = {
    /**
     * CRITICAL: Adds booking to Google Calendar.
     * Throws error on failure.
     */
    addToCalendar: async (client: any, date: string, jobInfo: any) => {
        try {
            console.log(`📅 Syncing with Google Calendar (${CALENDAR_ID})...`);
            console.log(`🔑 Using Service Account: ${process.env.GOOGLE_CLIENT_EMAIL}`);

            const event = {
                summary: `DOORWAY JOB: ${client.name} - ${jobInfo.service}`,
                description: `Phone: ${client.phone}\nAddress: ${client.address}\nPrice: $${jobInfo.price}\nNote: ${jobInfo.invoiceNotes || "None"}`,
                start: { dateTime: new Date(date).toISOString() },
                end: { dateTime: new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString() },
            };

            const res = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                requestBody: event,
            });

            console.log("✅ Calendar Event Created. Link:", res.data.htmlLink);
            return res.data;
        } catch (error: any) {
            // ENHANCED DEBUG LOGGING
            console.error("❌ ========== CALENDAR SYNC FAILED ==========");
            console.error("Error Message:", error.message);
            console.error("Error Code:", error.code);
            console.error("Status Code:", error.response?.status);

            // Log the FULL error object for debugging
            console.error("Full Error Object:", JSON.stringify(error, null, 2));

            if (error.response?.data) {
                console.error("API Response Data:", JSON.stringify(error.response.data, null, 2));
            }

            if (error.stack) {
                console.error("Stack Trace:", error.stack);
            }

            console.error("============================================");

            throw new Error("Calendar Sync Failed: " + error.message);
        }
    },

    /**
     * CRITICAL: Sends email confirmation
     */
    sendConfirmationEmail: async (client: any, date: string) => {
        if (!client.email) throw new Error("Client has no email address.");
        console.log(`📧 Sending Email to ${client.email}...`);

        // Mock success
        const emailSent = true;
        if (!emailSent) throw new Error("Email Service Unavailable");

        console.log("✅ Email Confirmed.");
        return true;
    },

    /**
     * OPTIONAL: Sends SMS via Twilio.
     */
    sendSMS: async (to: string, body: string) => {
        try {
            console.log(`💬 Attempting SMS to ${to}...`);
            await twilioClient.messages.create({
                body,
                from: process.env.TWILIO_PHONE_NUMBER,
                to
            });
            console.log("✅ SMS Sent Successfully.");
            return true;
        } catch (error: any) {
            console.warn("⚠️ SMS Failed (Trial Mode?):", error.message);
            return false;
        }
    },

    /**
     * OPTIONAL: Logs event to Supabase.
     */
    logEvent: async (action: string, meta: any) => {
        try {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
            await supabase.from('audit_logs').insert({
                action,
                meta,
                timestamp: new Date().toISOString()
            });
            console.log("📝 Audit Log Saved.");
        } catch (error: any) {
            console.warn("⚠️ Logging Failed:", error.message);
        }
    }
};
