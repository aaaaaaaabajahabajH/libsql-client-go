import { cn } from "@/lib/utils";

interface StrengthResult {
  score: number;
  label: string;
}

function computeStrength(password: string): StrengthResult {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak" };
  if (score === 2) return { score: 2, label: "Fair" };
  if (score === 3) return { score: 3, label: "Good" };
  if (score === 4) return { score: 4, label: "Strong" };
  return { score: 5, label: "Very Strong" };
}

const SEGMENT_COLORS: Record<number, string> = {
  1: "bg-destructive",
  2: "bg-warning",
  3: "bg-blue-500",
  4: "bg-success",
  5: "bg-success",
};

const LABEL_COLORS: Record<number, string> = {
  1: "text-destructive",
  2: "text-warning",
  3: "text-blue-500",
  4: "text-success",
  5: "text-success",
};

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label } = computeStrength(password);
  const activeColor = SEGMENT_COLORS[score] ?? "bg-muted";
  const labelColor = LABEL_COLORS[score] ?? "text-muted-foreground";

  return (
    <div className="mt-2 space-y-1.5" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={5}>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < score ? activeColor : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", labelColor)}>{label}</p>
    </div>
  );
}
