import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, hasError = false, ...props }, ref) => (
    <div className="relative">
      <select
        aria-invalid={hasError || props["aria-invalid"] || undefined}
        className={cn(
          "flex min-h-11 w-full appearance-none rounded-lg border border-input bg-surface px-3 py-2 pr-10 text-sm font-medium text-ink-display shadow-sm transition duration-200 ease-premium focus-visible:border-ring focus-visible:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          hasError &&
            "border-state-danger focus-visible:border-state-danger focus-visible:outline-state-danger",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  ),
);

Select.displayName = "Select";
