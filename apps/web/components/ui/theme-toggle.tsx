"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-background/80 p-1 shadow-sm backdrop-blur",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            aria-label={`Use ${option.label.toLowerCase()} theme`}
            className={cn(
              "grid size-8 place-items-center rounded-full text-muted-foreground transition duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active &&
                "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
            )}
            key={option.value}
            onClick={() => setTheme(option.value)}
            type="button"
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
