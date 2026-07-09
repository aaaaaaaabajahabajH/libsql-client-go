import { Bot } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link className="flex items-center gap-2 font-bold text-xl mb-4" href="/">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                AI Business
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Supercharge your business with AI-powered tools. Generate content,
              manage workflows, and grow faster.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-3">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/cookies" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Business Assistant. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with Next.js &amp; Supabase
          </p>
        </div>
      </div>
    </footer>
  );
}
