"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ThemeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { setTheme } = useTheme();

  function handleSelect(v: string) {
    setTheme(v);
    onChange(v);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-3 text-xs font-medium transition-all duration-150 w-24",
            value === v
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:bg-muted/50 hover:text-foreground",
          )}
          type="button"
          onClick={() => handleSelect(v)}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </div>
  );
}
