import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground",
        neutral: "border-border bg-muted text-foreground",
        secondary: "border-secondary bg-secondary text-secondary-foreground",
        accent: "border-border bg-accent text-accent-foreground",
        signal: "border-warning bg-warning text-warning-foreground",
        solid: "border-primary bg-primary text-primary-foreground",
        outline: "border-border bg-transparent text-foreground",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground",
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
