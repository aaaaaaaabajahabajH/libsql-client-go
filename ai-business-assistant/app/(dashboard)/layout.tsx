"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { cn } from "@/lib/utils";

// In production these come from a server-side context/session
const MOCK_USER = {
  name: "Jane Smith",
  email: "jane@company.com",
  avatarUrl: null,
  plan: "pro",
  creditsUsed: 2340,
  creditsTotal: 5000,
  creditsRemaining: 2660,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        creditsUsed={MOCK_USER.creditsUsed}
        creditsTotal={MOCK_USER.creditsTotal}
        plan={MOCK_USER.plan}
      />

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-60 bg-card border-r border-border/50 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              creditsUsed={MOCK_USER.creditsUsed}
              creditsTotal={MOCK_USER.creditsTotal}
              plan={MOCK_USER.plan}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={MOCK_USER.name}
          userEmail={MOCK_USER.email}
          avatarUrl={MOCK_USER.avatarUrl}
          plan={MOCK_USER.plan}
          credits={MOCK_USER.creditsRemaining}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "p-4 md:p-6"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
