import { ArrowRight, Sparkles, Zap, BarChart3, FileText, Share2, Mail } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─── Activity item in the preview ──────────────────────── */

interface PreviewActivity {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  time: string;
  credits: number;
  color: string;
}

const activities: PreviewActivity[] = [
  { icon: Share2, label: "LinkedIn post — Product launch", time: "2m ago", credits: 5, color: "text-pink-500 bg-pink-500/10" },
  { icon: Mail, label: "Follow-up email to client", time: "18m ago", credits: 5, color: "text-blue-500 bg-blue-500/10" },
  { icon: FileText, label: "Product description — Wireless headphones", time: "1h ago", credits: 5, color: "text-orange-500 bg-orange-500/10" },
];

/* ─── Dashboard Preview Section ─────────────────────────── */

export function DashboardPreview() {
  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="space-y-6">
            <Badge className="text-xs font-semibold px-3 py-1" variant="secondary">
              Live Dashboard
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
              Everything you need{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                in one view
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Your dashboard shows credit balance, recent generations, saved documents, and quick
              access to all 6 AI tools. No clutter — just the insights that matter.
            </p>

            <ul className="space-y-3">
              {[
                { icon: BarChart3, text: "Real-time usage stats and credit tracking" },
                { icon: Sparkles, text: "One-click launch for every AI tool" },
                { icon: Zap, text: "Instant history — every output saved automatically" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{item.text}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="h-12 px-8 shadow-glow" size="lg">
              <Link href="/register">
                See Your Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Right — dashboard mini */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/15 to-violet-500/15 blur-2xl opacity-60" />

            <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">30</span>
                    <span>credits left</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 p-5 border-b border-border/40">
                {[
                  { label: "Generations", value: "24", color: "text-violet-500" },
                  { label: "Credits Used", value: "120", color: "text-primary" },
                  { label: "Saved Docs", value: "8", color: "text-emerald-500" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border/40 p-3 text-center">
                    <p className={`text-xl font-bold ${s.color} tabular-nums`}>{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Recent Activity
                </p>
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.label} className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                        <a.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground">{a.time}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                        -{a.credits} cr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 right-8 animate-bounce [animation-duration:3.5s]">
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-card/95 backdrop-blur-sm px-3 py-1.5 shadow-lg">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium">Content ready!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
