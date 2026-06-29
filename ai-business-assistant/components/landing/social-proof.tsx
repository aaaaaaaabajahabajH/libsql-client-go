import { TrendingUp, Users, Zap, Globe } from "lucide-react";

const metrics = [
  { icon: Users, value: "500+", label: "Businesses trust us" },
  { icon: Zap, value: "10K+", label: "AI generations" },
  { icon: TrendingUp, value: "10×", label: "Average time saved" },
  { icon: Globe, value: "50+", label: "Languages supported" },
];

const companies = [
  "TechFlow Inc",
  "UrbanGoods",
  "MediaPulse",
  "NovaTech",
  "BrandBoost",
  "CloudScale",
  "GrowthLab",
  "LaunchPad",
];

export function SocialProof() {
  return (
    <section className="border-y border-border/50 bg-muted/20 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <p className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground mb-10">
          Trusted by fast-growing businesses worldwide
        </p>

        {/* Company names */}
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-14">
          {companies.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((m) => (
            <div key={m.label} className="text-center space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
                <m.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {m.value}
              </p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
