import { ArrowRight, Play, Sparkles, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─── Dashboard mockup ───────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow halo */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-violet-500/20 to-pink-500/20 blur-3xl opacity-70" />

      {/* Browser chrome */}
      <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* URL bar */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-4 py-3">
          <div className="flex gap-1.5 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-5 rounded-md bg-muted/60 max-w-xs mx-auto flex items-center px-3">
              <span className="text-[10px] text-muted-foreground">app.aibusiness.ai/dashboard</span>
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ height: "380px" }}>
          {/* Sidebar */}
          <div className="w-12 sm:w-44 border-r border-border/40 bg-sidebar/90 flex flex-col shrink-0 p-2 sm:p-3">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="h-6 w-6 rounded-md bg-primary shrink-0" />
              <div className="hidden sm:block h-3 w-20 rounded bg-sidebar-foreground/20" />
            </div>
            {[
              { active: true, w: "w-14" },
              { active: false, w: "w-10" },
              { active: false, w: "w-12" },
              { active: false, w: "w-8" },
              { active: false, w: "w-11" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg px-1.5 sm:px-2 py-2 mb-0.5 ${
                  item.active ? "bg-sidebar-accent" : ""
                }`}
              >
                <div className={`h-3 w-3 rounded shrink-0 ${item.active ? "bg-sidebar-accent-foreground/80" : "bg-sidebar-foreground/20"}`} />
                <div className={`hidden sm:block h-2 ${item.w} rounded ${item.active ? "bg-sidebar-accent-foreground/50" : "bg-sidebar-foreground/15"}`} />
              </div>
            ))}
            <div className="mt-auto px-1 pb-1 hidden sm:block">
              <div className="text-[9px] text-sidebar-foreground/40 mb-1.5 uppercase tracking-wider">Credits</div>
              <div className="h-1.5 w-full rounded-full bg-sidebar-border overflow-hidden">
                <div className="h-full w-2/5 rounded-full bg-sidebar-accent" />
              </div>
              <div className="text-[9px] text-sidebar-foreground/40 mt-1">20 / 50</div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-3 sm:p-4 space-y-3">
            {/* Welcome banner */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-violet-500/5 p-4">
              <div className="h-2.5 w-24 rounded bg-muted mb-2" />
              <div className="h-4 w-44 rounded bg-foreground/10 mb-1" />
              <div className="h-2 w-56 rounded bg-muted/70" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { c: "bg-violet-500/15", fill: "w-3/4" },
                { c: "bg-primary/15", fill: "w-1/2" },
                { c: "bg-emerald-500/15", fill: "w-2/3" },
                { c: "bg-orange-500/15", fill: "w-5/6" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-border/40 p-3">
                  <div className={`h-6 w-6 rounded-lg mb-2 ${s.c}`} />
                  <div className="h-3.5 w-9 rounded bg-foreground/10 mb-1.5" />
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${s.fill} rounded-full bg-primary/40`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Tool cards */}
            <div>
              <div className="h-2.5 w-16 rounded bg-muted mb-2" />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { g: "from-pink-500 to-rose-500" },
                  { g: "from-blue-500 to-cyan-500" },
                  { g: "from-violet-500 to-purple-500" },
                ].map((t, i) => (
                  <div key={i} className="rounded-lg border border-border/40 p-3 hover:border-primary/30 transition-colors">
                    <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${t.g} mb-2`} />
                    <div className="h-2.5 w-14 rounded bg-muted mb-1" />
                    <div className="h-2 w-16 rounded bg-muted/60" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification: generated */}
      <div className="absolute -top-3 right-4 sm:-right-6 animate-bounce [animation-duration:3s]">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-card/95 backdrop-blur-sm px-3 py-1.5 shadow-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium">Blog post generated!</span>
        </div>
      </div>

      {/* Floating credits badge */}
      <div className="absolute -bottom-3 left-4 sm:-left-6 animate-bounce [animation-duration:4s] [animation-delay:1.5s]">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 backdrop-blur-sm px-3 py-1.5 shadow-lg">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">5 credits used</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-violet-500/8 blur-[80px]" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-pink-500/8 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <Badge
            className="gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            variant="secondary"
          >
            <Sparkles className="h-3 w-3" />
            6 AI tools in one platform
            <ArrowRight className="h-3 w-3" />
          </Badge>

          {/* Headline */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              AI tools that help you
              <span className="block bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                grow 10× faster
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Generate social posts, professional emails, SEO blog content, and polished invoices
              in seconds — not hours. Trusted by 500+ growing businesses worldwide.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm sm:max-w-none sm:w-auto">
            <Button asChild className="h-12 px-8 text-base font-semibold shadow-glow w-full sm:w-auto" size="lg">
              <Link href="/register">
                <Zap className="h-4 w-4 mr-2" />
                Start for Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild className="h-12 px-8 text-base w-full sm:w-auto" size="lg" variant="outline">
              <a href="#how-it-works">
                <Play className="h-4 w-4 mr-2 fill-current" />
                See How It Works
              </a>
            </Button>
          </div>

          {/* Trust mini-row */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["bg-violet-500", "bg-pink-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500"].map((c, i) => (
                  <div key={i} className={`h-7 w-7 rounded-full border-2 border-background ${c} flex items-center justify-center`}>
                    <span className="text-[9px] font-bold text-white">{String.fromCharCode(65 + i)}</span>
                  </div>
                ))}
              </div>
              <span className="font-medium text-foreground">500+ businesses</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 font-medium text-foreground">4.9/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span><span className="font-semibold text-foreground">10,000+</span> AI generations</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="w-full mt-4 sm:mt-8 animate-fade-in [animation-delay:300ms]">
            <DashboardMockup />
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required &bull; 50 free credits monthly &bull; Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
