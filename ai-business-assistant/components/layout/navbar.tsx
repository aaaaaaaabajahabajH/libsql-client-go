"use client";

import { Bot, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link className="flex items-center gap-2 font-bold text-xl" href="/">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            AI Business
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="/pricing"
          >
            Pricing
          </Link>
          <Link
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="#testimonials"
          >
            Testimonials
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <nav className="container flex flex-col gap-1 py-4">
            <Link
              className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              href="/pricing"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              href="#features"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              href="#testimonials"
              onClick={() => setMenuOpen(false)}
            >
              Testimonials
            </Link>
            <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
              <Button asChild variant="outline">
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
