import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type PremiumCardProps = ComponentPropsWithoutRef<"article">;

export function PremiumCard({ className, ...props }: PremiumCardProps) {
  return (
    <article
      className={cn(
        "premium-card rounded-[1.75rem] p-6 shadow-soft transition duration-500 hover:-translate-y-1.5 hover:border-border-accent md:p-8",
        className,
      )}
      {...props}
    />
  );
}
