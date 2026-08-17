// TODO(phase: Dashboard layout): replace with the real sidebar shell
// (nav, org switcher, user menu, mobile drawer) once auth/session wiring lands.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/20">{children}</div>;
}
