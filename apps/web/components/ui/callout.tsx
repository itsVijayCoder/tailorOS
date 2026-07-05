import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const calloutVariants = cva(
  "rounded-xl border p-4 text-sm leading-6 shadow-sm",
  {
    variants: {
      variant: {
        neutral: "border-hairline bg-surface text-ink-body",
        info: "border-state-info bg-surface text-ink-body",
        success: "border-state-success bg-surface text-ink-body",
        warning: "border-signal bg-signal-faded text-ink-display",
        danger: "border-state-danger bg-surface text-ink-body",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export type CalloutProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof calloutVariants>;

export function Callout({ className, variant, ...props }: CalloutProps) {
  return (
    <div className={cn(calloutVariants({ variant }), className)} {...props} />
  );
}
