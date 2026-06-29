import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeCardProps {
  userName: string | null;
  totalGenerations: number;
  creditsBalance: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeCard({ userName, totalGenerations, creditsBalance }: WelcomeCardProps) {
  const firstName = userName?.split(" ")[0] ?? "there";
  const isFirstTime = totalGenerations === 0;

  return (
    <Card className="relative overflow-hidden border-border/50">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <CardContent className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI-powered workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-muted-foreground text-sm">
              {isFirstTime
                ? "Welcome! Pick an AI tool below to create your first piece of content."
                : `You have ${creditsBalance.toLocaleString()} credits ready. What will you create today?`}
            </p>
          </div>

          <Button
            asChild
            className="shrink-0 self-start sm:self-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm"
          >
            <Link href="/dashboard/tools">
              <Sparkles className="h-4 w-4 mr-2" />
              Start Creating
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
