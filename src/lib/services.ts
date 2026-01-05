import { google } from 'googleapis';
import Twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// --- HELPER: Key Sanitizer ---
const sanitize = (key: string | undefined) => {
    if (!key) return undefined;
    return key.replace(/['"]/g, "").replace(/\\n/g, "\n");
};

// --- CONFIGURATION ---
const SYSTEM_EMAIL = process.env.SYSTEM_EMAIL || "doorwaydetail@gmail.com";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// --- LAZY INITIALIZERS (Prevents Startup Crashes) ---
const getGoogleAuth = () => {
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const key = sanitize(process.env.GOOGLE_PRIVATE_KEY);

    if (!email || !key) {
        console.error("⚠️ SERVICES WARNING: Missing Google Credentials.");
        return null;
    }

    try {
        return new google.auth.JWT({
            email,
            key,
            scopes: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ],
        });
    } catch (e) {
        console.error("❌ Google Auth Init Failed:", e);
        return null;
    }
};

const getTwilioClient = () => {
    const sid = sanitize(process.env.TWILIO_ACCOUNT_SID);
    const token = sanitize(process.env.TWILIO_AUTH_TOKEN);
    if (!sid || !token) return null;
    return Twilio(sid, token);
};

// Supabase Init (Safe to do at top level if handled correctly, but let's be safe)
const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !key) return null;
    return createClient(url, key);
};

export const ServiceLayer = {
    /**
     * CRITICAL: Adds booking to Google Calendar.
     */
    addToCalendar: async (client: any, date: string, jobInfo: any) => {
        const auth = getGoogleAuth();
        if (!auth) {
            console.warn("⚠️ Skipping Calendar Sync: Auth missing.");
            return null;
        }

        const calendar = google.calendar({ version: 'v3', auth });

        try {
            console.log(`📅 Syncing with Google Calendar (${CALENDAR_ID})...`);

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
            console.error("❌ CALENDAR SYNC FAILED:", error.message);
            // We do NOT throw here so the user flow doesn't break completely.
            return null;
        }
    },

    /**
     * OPTIONAL: Sends SMS via Twilio.
     */
    sendSMS: async (to: string, body: string) => {
        const client = getTwilioClient();
        if (!client) {
            console.warn("⚠️ Skipping SMS: Twilio credentials missing.");
            return false;
        }

        try {
            console.log(`💬 Attempting SMS to ${to}...`);
            await client.messages.create({
                body,
                from: process.env.TWILIO_PHONE_NUMBER, // Ensure this env var exists!
                to
            });
            console.log("✅ SMS Sent Successfully.");
            return true;
        } catch (error: any) {
            console.warn("⚠️ SMS Failed:", error.message);
            return false;
        }
    },

    /**
     * OPTIONAL: Logs event to Supabase.
     */
    logEvent: async (action: string, meta: any) => {
        const supabase = getSupabase();
        if (!supabase) return;

        try {
            await supabase.from('audit_logs').insert({
                action,
                meta,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            console.warn("⚠️ Logging Failed:", error.message);
        }
    },

    // Stub for Email to prevent breakages if called
    sendConfirmationEmail: async (client: any, date: string) => {
        console.log("📧 Email stub called.");
        return true;
    }
};