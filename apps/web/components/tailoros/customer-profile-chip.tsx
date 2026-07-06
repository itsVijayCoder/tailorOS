import { Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CustomerProfileChipProps = {
  activeOrderCount?: number;
  className?: string;
  customerId: string;
  lastOrderLabel?: string;
  mobileLabel: string;
  name: string;
  relationLabel: string;
};

export function CustomerProfileChip({
  activeOrderCount = 0,
  className,
  customerId,
  lastOrderLabel,
  mobileLabel,
  name,
  relationLabel,
}: CustomerProfileChipProps) {
  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3 shadow-sm transition duration-200 ease-premium hover:border-border-accent hover:bg-page motion-reduce:transition-none",
        className,
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-faded text-accent-darker">
        <UserRound aria-hidden className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-ink-display">
            {name}
          </h3>
          <Badge variant={activeOrderCount > 0 ? "signal" : "neutral"}>
            {activeOrderCount} active
          </Badge>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-ink-muted">
          {customerId} · {relationLabel}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-ink-muted">
          <Phone aria-hidden className="size-3.5" />
          {mobileLabel}
          {lastOrderLabel ? <span>· {lastOrderLabel}</span> : null}
        </p>
      </div>
    </article>
  );
}
