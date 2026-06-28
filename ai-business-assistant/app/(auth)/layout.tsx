/**
 * Auth route group layout.
 * Wraps /login, /register, /forgot-password, /reset-password.
 * Full implementation in Milestone 3.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
