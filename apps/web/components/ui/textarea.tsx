import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    hasError?: boolean;
  };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, ...props }, ref) => (
    <textarea
      aria-invalid={hasError || props["aria-invalid"] || undefined}
      className={cn(
        "flex min-h-28 w-full resize-y rounded-lg border border-input bg-surface px-3 py-2.5 text-sm leading-6 text-ink-display shadow-sm transition duration-200 ease-premium placeholder:text-ink-muted focus-visible:border-ring focus-visible:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        hasError &&
          "border-state-danger focus-visible:border-state-danger focus-visible:outline-state-danger",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
