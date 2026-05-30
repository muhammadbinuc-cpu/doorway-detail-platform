// 🔒 Auto-chase overdue invoices. Triggered daily by Vercel Cron (see vercel.json).
// Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` when the
// CRON_SECRET env var is set — we reject anything that doesn't match.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { isOverdue, isReminderDue, type ReminderJobLike } from "@/lib/invoice";
import { runInvoiceReminder } from "@/lib/server/invoice-reminder";

// Don't cache; this must run live each invocation.
export const dynamic = "force-dynamic";

const toJobLike = (data: FirebaseFirestore.DocumentData): ReminderJobLike => ({
    status: data.status,
    invoicedAt: data.invoicedAt?.toDate?.() ?? null,
    lastReminderAt: data.lastReminderAt?.toDate?.() ?? null,
    reminderCount: Number(data.reminderCount) || 0,
});

export async function GET() {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        // Fail closed: without a secret configured we can't authenticate the caller.
        return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
    }

    const authHeader = (await headers()).get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    let flaggedUnpaid = 0;
    let remindersSent = 0;
    let scanned = 0;

    try {
        // Only unpaid invoice states can be overdue.
        const snap = await adminDb
            .collection("jobs")
            .where("status", "in", ["INVOICED", "UNPAID"])
            .get();

        for (const doc of snap.docs) {
            scanned++;
            const data = doc.data();
            const jobLike = toJobLike(data);
            if (!isOverdue(jobLike, now)) continue;

            // Auto-flag newly-overdue INVOICED jobs as UNPAID for a clear signal.
            if (data.status === "INVOICED") {
                await doc.ref.update({ status: "UNPAID", lastUpdated: Timestamp.now() });
                flaggedUnpaid++;
                jobLike.status = "UNPAID";
            }

            if (isReminderDue(jobLike, now)) {
                const res = await runInvoiceReminder(doc.id);
                if (res.success) remindersSent++;
            }
        }

        return NextResponse.json({ ok: true, scanned, flaggedUnpaid, remindersSent });
    } catch (error) {
        console.error("Invoice reminder cron failed:", error);
        return NextResponse.json({ error: "Cron run failed" }, { status: 500 });
    }
}
