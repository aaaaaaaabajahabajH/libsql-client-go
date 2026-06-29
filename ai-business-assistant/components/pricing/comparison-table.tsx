import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CellValue = boolean | string;

interface ComparisonRow {
  feature: string;
  free: CellValue;
  starter: CellValue;
  pro: CellValue;
}

const rows: ComparisonRow[] = [
  { feature: "AI Tools", free: "All 6", starter: "All 6", pro: "All 6" },
  { feature: "Monthly Credits", free: "50", starter: "1,000", pro: "5,000" },
  { feature: "History Retention", free: "7 days", starter: "90 days", pro: "Unlimited" },
  { feature: "Save Documents", free: false, starter: true, pro: true },
  { feature: "Priority Generation", free: false, starter: true, pro: true },
  { feature: "Priority Support", free: false, starter: true, pro: true },
  { feature: "Team Features", free: false, starter: false, pro: true },
  { feature: "API Access", free: false, starter: false, pro: true },
  { feature: "Export Options", free: "Copy only", starter: "Copy & Download", pro: "Copy, Download & API" },
];

function Cell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full", highlighted ? "bg-primary/15" : "bg-emerald-500/15")}>
        <Check className={cn("h-3 w-3", highlighted ? "text-primary" : "text-emerald-600 dark:text-emerald-400")} strokeWidth={3} />
      </span>
    ) : (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
        <X className="h-3 w-3 text-muted-foreground" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className={cn("text-sm font-medium", highlighted ? "text-primary font-semibold" : "text-foreground")}>
      {value}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-4 px-6 text-left text-sm font-semibold text-muted-foreground w-[40%]">
              Feature
            </th>
            <th className="py-4 px-6 text-center text-sm font-semibold">Free</th>
            <th className="py-4 px-6 text-center text-sm font-bold bg-primary/5 border-x border-primary/20">
              <span className="text-primary">Starter</span>
              <span className="block text-xs font-normal text-muted-foreground">Most Popular</span>
            </th>
            <th className="py-4 px-6 text-center text-sm font-semibold">Pro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.feature}
              className={cn(
                "border-b border-border/60 last:border-0 transition-colors hover:bg-muted/30",
                i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
              )}
            >
              <td className="py-3.5 px-6 text-sm font-medium">{row.feature}</td>
              <td className="py-3.5 px-6 text-center">
                <div className="flex justify-center">
                  <Cell value={row.free} />
                </div>
              </td>
              <td className="py-3.5 px-6 text-center bg-primary/5 border-x border-primary/20">
                <div className="flex justify-center">
                  <Cell value={row.starter} highlighted />
                </div>
              </td>
              <td className="py-3.5 px-6 text-center">
                <div className="flex justify-center">
                  <Cell value={row.pro} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
