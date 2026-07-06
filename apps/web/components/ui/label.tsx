import * as React from "react";

import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      className={cn(
        "text-sm font-semibold leading-none text-ink-display peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Label.displayName = "Label";
