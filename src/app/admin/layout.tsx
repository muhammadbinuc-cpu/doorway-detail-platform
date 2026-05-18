// 🔒 src/app/admin/layout.tsx - Admin Layout with Session Verification
// Server-side session verification using Firebase Admin SDK

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE_NAME = '__session';

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
    redirect('/login');
  }

  // 🔒 Verify the session cookie with Firebase Admin
  try {
    await adminAuth.verifySessionCookie(sessionCookie.value, true /* checkRevoked */);
  } catch (error: any) {
    // 🔒 Session invalid/expired - redirect to login
    console.error('[AdminLayout] Session verification failed:', error.code);
    redirect('/login');
  }

  return <>{children}</>;
}