/**
 * Dashboard route group layout.
 * Wraps /dashboard, /profile, /settings, /tools/*.
 * Full sidebar + header shell implemented in Milestone 5.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
