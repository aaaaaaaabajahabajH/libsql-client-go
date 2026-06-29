"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "/pricing", label: "Pricing" },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border/50 shadow-sm"
          : "bg-transparent",
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow-sm">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm sm:text-base gradient-text">
            AI Business Assistant
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="shadow-glow-sm">
            <Link href="/register">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Start Free
            </Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-border/50 space-y-2">
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
              </Button>
              <Button asChild className="w-full" size="sm">
                <Link href="/register" onClick={() => setMobileOpen(false)}>Start Free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
