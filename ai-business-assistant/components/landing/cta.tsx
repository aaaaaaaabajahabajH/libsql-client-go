import { ArrowRight, Zap, Shield, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const guarantees = [
  { icon: Zap, label: "50 free credits" },
  { icon: Shield, label: "No credit card" },
  { icon: RefreshCw, label: "Cancel anytime" },
];

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-indigo-700 px-8 py-16 sm:px-16 sm:py-24 text-center text-white shadow-2xl">
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Glow accents */}
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <div className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm border border-white/20">
              Start today — no setup required
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to grow your business
              <span className="block text-white/90">10× faster with AI?</span>
            </h2>

            <p className="text-lg text-white/80 leading-relaxed">
              Join 10,000+ businesses using AI Business Assistant. Create your first piece of
              content in under 60 seconds — completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="h-12 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-lg"
                size="lg"
              >
                <Link href="/register">
                  <Zap className="h-4 w-4 mr-2" />
                  Start for Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 px-8 text-base border-white/30 text-white bg-transparent hover:bg-white/10"
                size="lg"
                variant="outline"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            {/* Guarantees */}
            <div className="flex flex-wrap justify-center gap-5 pt-2">
              {guarantees.map((g) => (
                <div key={g.label} className="flex items-center gap-2 text-sm text-white/80">
                  <g.icon className="h-4 w-4 text-white/60" />
                  {g.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
