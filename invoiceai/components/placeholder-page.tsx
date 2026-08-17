import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  phase: string;
}

/**
 * Temporary stand-in used while the project structure is scaffolded.
 * Each route is replaced with its real implementation in the phase noted below.
 */
export function PlaceholderPage({ title, description, phase }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">قيد الإنشاء — {phase}</p>
        </CardContent>
      </Card>
    </div>
  );
}
