import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type AnimatedBadgeProps = ComponentPropsWithoutRef<"span">;

export function AnimatedBadge({ className, ...props }: AnimatedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-secondary/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm",
        className,
      )}
      data-reveal
      {...props}
    />
  );
}
