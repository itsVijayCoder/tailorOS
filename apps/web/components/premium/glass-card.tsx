import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = ComponentPropsWithoutRef<"div">;

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-border bg-card/65 p-5 shadow-raised backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
