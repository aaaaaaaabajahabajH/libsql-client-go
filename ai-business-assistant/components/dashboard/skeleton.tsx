import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function WelcomeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-6 sm:p-8">
      <Skeleton className="h-3 w-32 mb-3" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function StatsSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CreditsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex justify-between mb-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-2 w-full mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function AIToolsGridSkeleton() {
  return (
    <div>
      <Skeleton className="h-5 w-20 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-36 mt-3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-6">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SavedDocumentsSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-6">
      <Skeleton className="h-5 w-36 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <WelcomeCardSkeleton />
      <StatsSectionSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIToolsGridSkeleton />
        </div>
        <div className="space-y-6">
          <CreditsCardSkeleton />
          <SavedDocumentsSkeleton />
        </div>
      </div>
      <ActivitySkeleton />
    </div>
  );
}
