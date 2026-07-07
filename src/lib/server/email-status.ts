// 🔒 Server-only: shared helpers for customer email sends.
// - recordEmailStatus: stamp the outcome of the latest send on the job doc so
//   the admin UI can show "Emailed ✓ / failed" instead of silent failures.
// - resolveRecipientEmail: prefer the client's CURRENT email over the copy
//   frozen on the job at quote time (and re-sync the job copy).
import "server-only";

import { Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { SendMailResult } from "@/lib/server/mailer";

/** Never throws — a bookkeeping failure must not break the send path. */
export async function recordEmailStatus(
  jobRef: DocumentReference,
  result: SendMailResult,
): Promise<void> {
  try {
    await jobRef.update({
      lastEmailAt: Timestamp.now(),
      lastEmailStatus: result.ok ? "sent" : "failed",
      lastEmailError: result.ok ? "" : result.error || "Unknown error",
    });
  } catch (e) {
    console.error("recordEmailStatus failed (non-blocking):", e);
  }
}

/**
 * Returns the freshest known email for the job's customer. If the client doc
 * has a different (non-empty) email than the job, the job copy is updated so
 * future sends and reminders use it too. Falls back to job.email.
 */
export async function resolveRecipientEmail(
  jobRef: DocumentReference,
  job: FirebaseFirestore.DocumentData,
): Promise<string> {
  const jobEmail = String(job.email || "");
  const clientId = String(job.clientId || "");
  if (!clientId) return jobEmail;
  try {
    const client = (
      await adminDb.collection("clients").doc(clientId).get()
    ).data();
    const clientEmail = String(client?.email || "").trim();
    if (clientEmail && clientEmail !== jobEmail) {
      await jobRef.update({ email: clientEmail });
      return clientEmail;
    }
  } catch (e) {
    console.error("resolveRecipientEmail lookup failed (non-blocking):", e);
  }
  return jobEmail;
}
