import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Change to default export and rename function to 'proxy'
export default function proxy(request: NextRequest) {
  // Check if user is trying to go to /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {

    const authCookie = request.cookies.get('admin_session');

    // NOTE: Since you just switched to Firebase, this cookie check might need 
    // to be updated later. For now, this keeps the file valid.
    if (!authCookie || authCookie.value !== process.env.ADMIN_SECRET) {
      // Ideally, you'd check Firebase tokens here, but this preserves your existing logic.
      // If you get stuck in a loop, verify you are setting the cookie on login.
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*', // Protects everything under /admin
};