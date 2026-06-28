"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
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
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#testimonials"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Testimonials
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <nav className="container flex flex-col gap-1 py-4">
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#features"
              className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Testimonials
            </Link>
            <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
              <Button variant="outline" asChild>
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
