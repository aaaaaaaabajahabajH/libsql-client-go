import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="shrink-0 border-b lg:border-b-0 lg:border-r border-border lg:w-60 xl:w-64">
        <div className="p-4 lg:p-5">
          <div className="mb-4">
            <h1 className="text-lg font-bold tracking-tight">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your account and preferences
            </p>
          </div>
          <SettingsNav />
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
