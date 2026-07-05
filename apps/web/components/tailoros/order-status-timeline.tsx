import { CheckCircle2, CircleDashed } from "lucide-react";

import {
  StatusChip,
  type TailorOSStatus,
} from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  actor?: string;
  current?: boolean;
  label: string;
  status: TailorOSStatus;
  timestamp: string;
};

export type OrderStatusTimelineProps = {
  className?: string;
  steps: TimelineStep[];
};

export function OrderStatusTimeline({
  className,
  steps,
}: OrderStatusTimelineProps) {
  return (
    <ol className={cn("grid gap-3", className)}>
      {steps.map((step, index) => {
        const Icon = step.current ? CircleDashed : CheckCircle2;

        return (
          <li className="relative grid grid-cols-[2rem_1fr] gap-3" key={step.label}>
            {index < steps.length - 1 ? (
              <span className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px bg-hairline" />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid size-8 place-items-center rounded-full border border-hairline bg-surface text-ink-muted",
                step.current && "border-accent bg-accent text-accent-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" />
            </span>
            <div className="rounded-xl border border-hairline bg-surface p-3 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-display">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {step.timestamp}
                    {step.actor ? ` · ${step.actor}` : ""}
                  </p>
                </div>
                <StatusChip status={step.status} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
