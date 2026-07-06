import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, ...props }, ref) => (
    <input
      aria-invalid={hasError || props["aria-invalid"] || undefined}
      className={cn(
        "flex min-h-11 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-ink-display shadow-sm transition duration-200 ease-premium placeholder:text-ink-muted focus-visible:border-ring focus-visible:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        hasError &&
          "border-state-danger focus-visible:border-state-danger focus-visible:outline-state-danger",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Input.displayName = "Input";
