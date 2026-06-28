import {
  FileText,
  Mail,
  Globe,
  Share2,
  Receipt,
  PenTool,
  Zap,
  Shield,
  RefreshCw,
} from "lucide-react";

const tools = [
  {
    icon: Share2,
    title: "Social Media Generator",
    description:
      "Create engaging posts for Twitter, LinkedIn, Instagram, and more in seconds.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: FileText,
    title: "Product Description",
    description:
      "Write compelling product descriptions that convert browsers into buyers.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Mail,
    title: "Email Writer",
    description:
      "Draft professional emails, follow-ups, and campaigns with AI precision.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Receipt,
    title: "Invoice Generator",
    description:
      "Generate professional invoices and business documents instantly.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: PenTool,
    title: "Blog Writer",
    description:
      "Produce SEO-optimized blog posts and articles that rank and engage.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Globe,
    title: "Text Translator",
    description:
      "Translate content into 50+ languages while preserving tone and context.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "10x Faster",
    description: "Generate professional content in seconds, not hours.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and never used to train AI models.",
  },
  {
    icon: RefreshCw,
    title: "Always Improving",
    description: "New AI models and tools added every month.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Every Tool You Need,{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              All in One Place
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Stop juggling multiple apps. Our AI suite covers every business
            content need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="group relative rounded-xl border border-border/50 bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradient} mb-4 shadow-lg`}
              >
                <tool.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{tool.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tool.description}
              </p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-violet-500/3 transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {benefits.map((b) => (
            <div key={b.title} className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">{b.title}</h4>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
