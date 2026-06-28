import Link from "next/link";
import { Bot } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-primary via-violet-700 to-indigo-800 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Bot className="h-5 w-5" />
            </div>
            AI Business Assistant
          </Link>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <blockquote className="mt-auto">
            <p className="text-xl font-medium leading-relaxed mb-6">
              &ldquo;AI Business Assistant cut our content creation time by 80%.
              Our team now produces 3x more content without burning out.&rdquo;
            </p>
            <footer>
              <p className="font-semibold">Sarah Chen</p>
              <p className="text-white/70 text-sm">Marketing Director, TechFlow</p>
            </footer>
          </blockquote>
        </div>
        <div className="relative flex items-center gap-8 text-white/70 text-sm">
          <span>50 free credits</span>
          <span>•</span>
          <span>No credit card</span>
          <span>•</span>
          <span>Cancel anytime</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                AI Business
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
