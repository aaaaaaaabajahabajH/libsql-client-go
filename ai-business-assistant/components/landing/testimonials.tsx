import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    company: "TechFlow Inc",
    avatar: "SC",
    avatarColor: "bg-violet-500/15 text-violet-600",
    content:
      "AI Business Assistant cut our content creation time by 80%. Our team now produces 3× more content without burning out. The quality consistently exceeds what we used to write manually.",
    rating: 5,
    highlight: "3× more content",
  },
  {
    name: "Marcus Johnson",
    role: "E-commerce Founder",
    company: "UrbanGoods",
    avatar: "MJ",
    avatarColor: "bg-orange-500/15 text-orange-600",
    content:
      "The product description generator alone pays for itself ten times over. Our conversion rate jumped 34% after rewriting our listings with AI. It understands customer psychology.",
    rating: 5,
    highlight: "34% more conversions",
  },
  {
    name: "Priya Sharma",
    role: "Freelance Consultant",
    company: "Independent",
    avatar: "PS",
    avatarColor: "bg-pink-500/15 text-pink-600",
    content:
      "I use the email writer and invoice generator every single day. Everything looks polished and professional. My clients have noticed, and I've been able to raise my rates as a result.",
    rating: 5,
    highlight: "Used every day",
  },
  {
    name: "David Kim",
    role: "Content Strategist",
    company: "MediaPulse",
    avatar: "DK",
    avatarColor: "bg-blue-500/15 text-blue-600",
    content:
      "Blog articles that used to take 4 hours now take 20 minutes. The quality matches our senior writers. I was skeptical at first — now I couldn't do my job without it.",
    rating: 5,
    highlight: "4h → 20min per article",
  },
  {
    name: "Aisha Patel",
    role: "Startup CEO",
    company: "NovaTech",
    avatar: "AP",
    avatarColor: "bg-emerald-500/15 text-emerald-600",
    content:
      "The translator tool is phenomenal. We expanded to 3 new markets in one month because we could localize content so quickly. It preserved our brand voice perfectly in every language.",
    rating: 5,
    highlight: "3 new markets in 1 month",
  },
  {
    name: "Tom Williams",
    role: "Social Media Manager",
    company: "BrandBoost",
    avatar: "TW",
    avatarColor: "bg-indigo-500/15 text-indigo-600",
    content:
      "Social content that consistently resonates with our audience. The AI understands brand voice better than I expected — posts feel authentic, not robotic. Our engagement is up 58%.",
    rating: 5,
    highlight: "58% more engagement",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-muted/20" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="text-xs font-semibold px-3 py-1" variant="secondary">
            Customer Stories
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              10,000+ businesses
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Real results from real customers who scaled their content with AI Business Assistant.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col"
            >
              <CardContent className="p-6 flex flex-col flex-1">
                <StarRating count={t.rating} />

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.content}&rdquo;
                </p>

                {/* Highlight metric */}
                <div className="mt-4 mb-4">
                  <Badge
                    className="text-[11px] font-semibold text-primary border-primary/20 bg-primary/5"
                    variant="secondary"
                  >
                    {t.highlight}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-xs font-bold ${t.avatarColor}`}>
                      {t.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{t.name}</p>
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
