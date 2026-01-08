import 'server-only'; // 🛡️ CRITICAL SAFETY LOCK

import { google } from 'googleapis';
import Twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// --- HELPER: Key Sanitizer ---
const sanitize = (key: string | undefined) => {
    if (!key) return undefined;
    return key.replace(/['"]/g, "").replace(/\\n/g, "\n");
};

// --- CONFIGURATION ---
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// --- LAZY INITIALIZERS ---
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

const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !key) return null;
    return createClient(url, key);
};

export const ServiceLayer = {
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
            return null;
        }
    },

    sendSMS: async (to: string, body: string) => {
        const client = getTwilioClient();
        if (!client) {
            console.warn("⚠️ Skipping SMS: Twilio credentials missing.");
            return false;
        }

        try {
            await client.messages.create({
                body,
                from: process.env.TWILIO_PHONE_NUMBER,
                to
            });
            console.log("✅ SMS Sent.");
            return true;
        } catch (error: any) {
            console.warn("⚠️ SMS Failed:", error.message);
            return false;
        }
    },

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
    }
};