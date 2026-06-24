// 🔒 Remind customers of upcoming appointments. Triggered daily by Vercel Cron
// (see vercel.json). Vercel sends `Authorization: Bearer ${CRON_SECRET}` when
// CRON_SECRET is set — we reject anything that doesn't match.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { runAppointmentReminder } from "@/lib/server/appointment-reminder";

// Don't cache; this must run live each invocation.
export const dynamic = "force-dynamic";

// Remind for appointments happening within this many hours from now. The cron
// runs daily, so a ~36h window comfortably catches "tomorrow" without double
// sending (each job is marked appointmentReminderSent once reminded).
const WINDOW_HOURS = 36;

export async function GET() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }

  const authHeader = (await headers()).get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const windowEnd = now + WINDOW_HOURS * 60 * 60 * 1000;
  let scanned = 0;
  let remindersSent = 0;

  try {
    const snap = await adminDb
      .collection("jobs")
      .where("status", "==", "SCHEDULED")
      .get();

    for (const doc of snap.docs) {
      scanned++;
      const data = doc.data();
      if (data.appointmentReminderSent) continue;
      if (!data.scheduledDate) continue;
      const when = new Date(data.scheduledDate).getTime();
      if (Number.isNaN(when)) continue;
      // Only remind for upcoming appointments inside the window (not past ones).
      if (when < now || when > windowEnd) continue;

      const res = await runAppointmentReminder(doc.id);
      if (res.success) remindersSent++;
    }

    return NextResponse.json({ ok: true, scanned, remindersSent });
  } catch (error) {
    console.error("Appointment reminder cron failed:", error);
    return NextResponse.json({ error: "Cron run failed" }, { status: 500 });
  }
}
