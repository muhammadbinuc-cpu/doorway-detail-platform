import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Check if user is trying to go to /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 2. Check for the NEW secret cookie (Cache Buster V2)
    // We changed this from 'admin_session' to 'session_token_v2' to fix the login loop
    const authCookie = request.cookies.get('session_token_v2');
    
    // 3. If no cookie, kick them to the login page
    if (!authCookie || authCookie.value !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*', // Protects everything under /admin
};