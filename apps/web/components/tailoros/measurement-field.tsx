import { AlertTriangle, Ruler } from "lucide-react";

import { cn } from "@/lib/utils";

export type MeasurementFieldProps = {
  className?: string;
  label: string;
  previousValue?: string;
  unit: string;
  value: string;
  warning?: string;
};

export function MeasurementField({
  className,
  label,
  previousValue,
  unit,
  value,
  warning,
}: MeasurementFieldProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-surface p-4 shadow-sm",
        warning && "border-signal bg-signal-faded",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-display">{label}</p>
        {warning ? (
          <AlertTriangle aria-hidden className="size-4 text-signal-darker" />
        ) : (
          <Ruler aria-hidden className="size-4 text-ink-muted" />
        )}
      </div>
      <p className="mt-3 font-ui text-2xl font-semibold text-ink-display">
        {value}
        <span className="ml-1 text-sm font-medium text-ink-muted">{unit}</span>
      </p>
      {previousValue ? (
        <p className="mt-2 text-xs text-ink-muted">Previous {previousValue}</p>
      ) : null}
      {warning ? (
        <p className="mt-2 text-xs font-medium text-signal-darker">{warning}</p>
      ) : null}
    </div>
  );
}
