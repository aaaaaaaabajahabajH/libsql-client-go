import { BarChart2, Bot, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Sparkles,
    title: "6 AI-powered tools",
    description:
      "From social posts to blog articles — all generated in seconds.",
  },
  {
    icon: Zap,
    title: "Credit-based usage",
    description: "Pay only for what you use. Start free, upgrade anytime.",
  },
  {
    icon: BarChart2,
    title: "Business-ready output",
    description: "Professional content tailored to your brand and industry.",
  },
] as const;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel — hidden on mobile */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 lg:flex">
        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            AI Business Assistant
          </span>
        </Link>

        {/* Feature list */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
              Your AI-powered business toolkit
            </h2>
            <p className="mt-3 text-base text-white/70">
              Generate content, write emails, create product descriptions, and
              more — all in seconds.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-xs text-white/60">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <blockquote className="relative rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-sm italic text-white/80">
            &ldquo;AI Business Assistant cut our content creation time by 80%.
            It&apos;s like having a full marketing team at our
            fingertips.&rdquo;
          </p>
          <footer className="mt-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-white/20" />
            <span className="text-xs text-white/60">
              Sarah K., Marketing Director at TechFlow
            </span>
          </footer>
        </blockquote>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">AI Business Assistant</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
