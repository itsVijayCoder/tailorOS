import * as React from "react";
import { Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isLoading?: boolean;
};

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, isLoading = false, ...props }, ref) => (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        className={cn(
          "flex min-h-11 w-full rounded-full border border-input bg-surface px-10 py-2 text-sm text-ink-display shadow-sm transition duration-200 ease-premium placeholder:text-ink-muted focus-visible:border-ring focus-visible:bg-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          className,
        )}
        ref={ref}
        type="search"
        {...props}
      />
      {isLoading ? (
        <Loader2
          aria-hidden
          className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-muted"
        />
      ) : null}
    </div>
  ),
);

SearchField.displayName = "SearchField";
