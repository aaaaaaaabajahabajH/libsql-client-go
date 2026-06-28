import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";

export const metadata: Metadata = {
  title: "AI Business Assistant — Grow Faster with AI",
  description:
    "Generate content, write emails, create invoices, translate text, and more with AI. Save hours daily and scale your business.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
