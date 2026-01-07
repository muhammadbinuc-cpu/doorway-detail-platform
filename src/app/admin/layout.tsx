import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the session cookie
  const cookieStore = await cookies();
  const session = cookieStore.get('session_token_v2');
  
  // 2. Check against the Server Secret
  const secret = process.env.ADMIN_SECRET;

  // 3. The Gatekeeper Check
  if (!session || !secret || session.value !== secret) {
      // If cookie is missing or doesn't match secret -> Kick to Login
      redirect('/login');
  }

  return <>{children}</>;
}