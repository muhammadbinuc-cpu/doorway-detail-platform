export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🟢 SECURITY REMOVED: No cookies, no redirects.
  // This just renders the dashboard.
  return <>{children}</>;
}