// 🔒 src/app/api/auth/verify/route.ts
// API route for session cookie verification (used by proxy)
// Proxy can't use firebase-admin directly, so it calls this API

import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

        if (!sessionCookie?.value) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        // 🔒 Verify the session cookie with Firebase Admin
        // checkRevoked: true ensures revoked sessions are rejected
        const decodedClaims = await adminAuth.verifySessionCookie(
            sessionCookie.value,
            true // checkRevoked
        );

        return NextResponse.json({
            valid: true,
            uid: decodedClaims.uid,
            email: decodedClaims.email
        });

    } catch (error) {
        // 🔒 Log the error internally, return generic 401
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Auth Verify] Session verification failed:', message);

        return NextResponse.json({ valid: false }, { status: 401 });
    }
}
