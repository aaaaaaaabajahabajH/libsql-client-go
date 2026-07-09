import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  noDivider?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
  noDivider,
}: SettingsSectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-base font-semibold leading-6">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {!noDivider && <Separator />}
      <div className="space-y-6">{children}</div>
    </section>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6 items-start", className)}>
      <div className="sm:col-span-1">
        <p className="text-sm font-medium leading-none">{label}</p>
        {description && (
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}
