// 🔒 src/middleware.ts - Secure Authentication Middleware
// Protects admin routes with Firebase session cookie verification

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = '__session';

// 🔒 Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request: NextRequest) {
  // 🔒 Only protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {

    // 🔒 Get session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // 🔒 No session cookie = redirect to login
    if (!sessionCookie?.value) {
      console.log('[Middleware] No session cookie, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 🔒 Verify session cookie via API route
    // (Middleware runs on Edge Runtime and can't use firebase-admin directly)
    try {
      const verifyUrl = new URL('/api/auth/verify', request.url);
      const verifyResponse = await fetch(verifyUrl, {
        headers: {
          'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie.value}`
        }
      });

      if (!verifyResponse.ok) {
        console.log('[Middleware] Session verification failed');
        // 🔒 Clear invalid session cookie and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }
    } catch (error) {
      console.error('[Middleware] Session verification error:', error);
      // 🔒 On verification error, redirect to login for safety
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*', // 🔒 Protects everything under /admin
};