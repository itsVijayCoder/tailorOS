import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MessageCircle,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type TailorOSStatus =
  | "draft"
  | "booked"
  | "in-progress"
  | "ready"
  | "delivered"
  | "closed"
  | "cancelled"
  | "blocked"
  | "delayed"
  | "paid"
  | "partial"
  | "unpaid"
  | "queued"
  | "sent"
  | "delivered-message"
  | "read"
  | "failed"
  | "opted-out";

const statusConfig: Record<
  TailorOSStatus,
  {
    className: string;
    icon: typeof CircleDashed;
    label: string;
  }
> = {
  draft: {
    className: "border-hairline bg-surface text-ink-muted",
    icon: CircleDashed,
    label: "Draft",
  },
  booked: {
    className: "border-accent-faded bg-accent-faded text-ink-display",
    icon: CheckCircle2,
    label: "Booked",
  },
  "in-progress": {
    className: "border-accent bg-surface text-accent",
    icon: Clock3,
    label: "In progress",
  },
  ready: {
    className: "border-state-success bg-state-success text-success-foreground",
    icon: PackageCheck,
    label: "Ready",
  },
  delivered: {
    className: "border-state-success bg-surface text-state-success",
    icon: CheckCircle2,
    label: "Delivered",
  },
  closed: {
    className: "border-hairline bg-surface text-ink-display",
    icon: CheckCircle2,
    label: "Closed",
  },
  cancelled: {
    className:
      "border-state-danger bg-state-danger text-destructive-foreground",
    icon: ShieldAlert,
    label: "Cancelled",
  },
  blocked: {
    className: "border-state-danger bg-surface text-state-danger",
    icon: ShieldAlert,
    label: "Blocked",
  },
  delayed: {
    className: "border-signal bg-signal-faded text-signal-darker",
    icon: AlertTriangle,
    label: "Delayed",
  },
  paid: {
    className: "border-state-success bg-state-success text-success-foreground",
    icon: CheckCircle2,
    label: "Paid",
  },
  partial: {
    className: "border-signal bg-signal-faded text-signal-darker",
    icon: Clock3,
    label: "Partially paid",
  },
  unpaid: {
    className: "border-state-danger bg-surface text-state-danger",
    icon: ShieldAlert,
    label: "Unpaid",
  },
  queued: {
    className: "border-wa-queued bg-surface text-wa-queued",
    icon: CircleDashed,
    label: "Queued",
  },
  sent: {
    className: "border-wa-sent bg-surface text-wa-sent",
    icon: MessageCircle,
    label: "Sent",
  },
  "delivered-message": {
    className: "border-wa-delivered bg-surface text-wa-delivered",
    icon: CheckCircle2,
    label: "Delivered",
  },
  read: {
    className: "border-wa-read bg-wa-read text-primary-foreground",
    icon: CheckCircle2,
    label: "Read",
  },
  failed: {
    className: "border-wa-failed bg-surface text-wa-failed",
    icon: ShieldAlert,
    label: "Failed",
  },
  "opted-out": {
    className:
      "border-state-danger bg-state-danger text-destructive-foreground",
    icon: ShieldAlert,
    label: "Opted out",
  },
};

export type StatusChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  status: TailorOSStatus;
};

export function StatusChip({ className, status, ...props }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold leading-none transition duration-200 ease-premium motion-safe:data-[pulse=true]:animate-pulse motion-reduce:transition-none",
        config.className,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className="size-3.5" />
      {config.label}
    </span>
  );
}
