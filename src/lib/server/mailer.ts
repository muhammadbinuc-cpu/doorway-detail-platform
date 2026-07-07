// 🔒 Server-only: email transport. Sends from the Doorway Detail Gmail via SMTP.
// Keep this out of any "use server" module — it is a transport helper, not an action.
import "server-only";

import nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { sanitizeKey } from "@/lib/key-utils";

// Display name + address used as the From on every customer-facing email.
export const MAIL_FROM = "Doorway Detail <doorwaydetail@gmail.com>";

let _transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (_transport) return _transport;
  const user = sanitizeKey(process.env.GMAIL_USER);
  const pass = sanitizeKey(process.env.GMAIL_APP_PASSWORD);
  if (!user || !pass) return null; // not configured — caller treats as a delivery failure
  _transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    // Serverless: a hung SMTP handshake must fail fast, not eat the
    // whole function timeout while the admin stares at a spinner.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return _transport;
}

export interface SendMailArgs {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: Attachment[];
}

export interface SendMailResult {
  ok: boolean;
  error?: string;
}

/**
 * Render a React Email component to HTML and send it via Gmail SMTP.
 * Never throws — returns { ok, error } so callers can surface a delivery
 * warning without failing the underlying DB write.
 */
export async function sendMail({
  to,
  subject,
  react,
  attachments,
}: SendMailArgs): Promise<SendMailResult> {
  try {
    const transport = getTransport();
    if (!transport) {
      return {
        ok: false,
        error: "Email not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing)",
      };
    }
    const html = await render(react);
    const text = await render(react, { plainText: true });
    await transport.sendMail({
      from: MAIL_FROM,
      replyTo: MAIL_FROM,
      to,
      subject,
      html,
      text,
      attachments,
    });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("sendMail failed:", error);
    return { ok: false, error };
  }
}
