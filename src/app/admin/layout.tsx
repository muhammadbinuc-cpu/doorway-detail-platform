// 🔒 src/app/admin/layout.tsx - Admin Layout with Session Verification
// Server-side session verification using Firebase Admin SDK

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

const SESSION_COOKIE_NAME = "__session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔒 Get the session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  // 🔒 No session cookie = redirect to login
  if (!sessionCookie?.value) {
    redirect("/login");
  }

  // 🔒 Verify the session cookie with Firebase Admin
  try {
    await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true /* checkRevoked */,
    );
  } catch (error) {
    // 🔒 Session invalid/expired - redirect to login
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "unknown";
    console.error("[AdminLayout] Session verification failed:", code);
    redirect("/login");
  }

  const emailConfigured = Boolean(
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD,
  );

  return (
    <ConfirmProvider>
      {!emailConfigured && (
        <div className="bg-red-600 text-white text-sm font-bold text-center px-4 py-2">
          Email sending is not configured — invoices, quotes and receipts will
          not be delivered. Set GMAIL_USER and GMAIL_APP_PASSWORD.
        </div>
      )}
      {children}
    </ConfirmProvider>
  );
}
