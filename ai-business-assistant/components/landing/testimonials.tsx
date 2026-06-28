import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    company: "TechFlow",
    avatar: "SC",
    content:
      "AI Business Assistant cut our content creation time by 80%. Our team now produces 3x more content without burning out. It's a game changer.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "E-commerce Founder",
    company: "UrbanGoods",
    avatar: "MJ",
    content:
      "The product description generator alone pays for itself. Our conversion rate jumped 34% after rewriting all our listings with AI.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Freelance Consultant",
    company: "Independent",
    avatar: "PS",
    content:
      "I use the email writer and invoice generator every day. Looks incredibly professional and clients love the clarity of my communications.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Content Strategist",
    company: "MediaPulse",
    avatar: "DK",
    content:
      "Blog articles that used to take 4 hours now take 20 minutes. The quality is on par with our senior writers. Absolutely outstanding.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Startup CEO",
    company: "NovaTech",
    avatar: "AP",
    content:
      "The translator tool is phenomenal. We expanded to 3 new markets in one month because we could localize content so fast.",
    rating: 5,
  },
  {
    name: "Tom Williams",
    role: "Social Media Manager",
    company: "BrandBoost",
    avatar: "TW",
    content:
      "Social media content that resonates with our audience every time. The AI understands brand voice better than I expected.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-20 md:py-28 bg-muted/30"
    >
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              10,000+ Businesses
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Real results from real customers who scaled their content with AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {t.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
