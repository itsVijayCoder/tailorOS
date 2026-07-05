import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none transition-colors duration-200 ease-premium",
  {
    variants: {
      variant: {
        default: "border-accent bg-accent text-accent-foreground",
        neutral: "border-hairline bg-surface text-ink-body",
        secondary: "border-hairline bg-secondary text-secondary-foreground",
        accent: "border-accent bg-accent text-accent-foreground",
        signal: "border-signal bg-signal text-signal-darker",
        solid: "border-accent bg-accent text-accent-foreground",
        outline: "border-hairline bg-transparent text-ink-display",
        success: "border-state-success bg-state-success text-success-foreground",
        warning: "border-signal bg-signal text-signal-darker",
        info: "border-state-info bg-state-info text-primary-foreground",
        whatsapp: "border-wa-read bg-wa-read text-primary-foreground",
        destructive:
          "border-state-danger bg-state-danger text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
