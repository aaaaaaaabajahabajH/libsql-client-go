interface StorageRingProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  colorClass?: string;
}

export function StorageRing({ label, value, max, unit = "", colorClass = "text-primary" }: StorageRingProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96">
          <circle
            className="stroke-muted fill-none"
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
          />
          <circle
            className={`fill-none transition-all duration-700 ${colorClass.replace("text-", "stroke-")}`}
            cx="48"
            cy="48"
            r={radius}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold leading-none ${colorClass}`}>
            {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{unit}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-center">{label}</p>
      <p className="text-[11px] text-muted-foreground text-center">
        {pct.toFixed(0)}% of {max >= 1000 ? `${(max / 1000).toFixed(1)}k` : max}
      </p>
    </div>
  );
}
