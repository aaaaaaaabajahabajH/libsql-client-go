import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-indigo-700 p-10 md:p-16 text-center text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Start Growing With AI Today
            </h2>
            <p className="text-white/80 max-w-xl mx-auto text-lg mb-8">
              Join 10,000+ businesses using AI Business Assistant. Get 50 free
              credits — no credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="gap-2 text-base h-12 bg-white text-primary hover:bg-white/90"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 text-base h-12 border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
