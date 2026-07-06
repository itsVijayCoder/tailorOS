import type { ComponentType, ReactNode } from "react";

import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{ className?: string }>;

export function PageHeader({
  actions,
  eyebrow,
  title,
  body,
}: {
  actions?: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section className="border-b border-hairline bg-page px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="signal">{eyebrow}</Badge>
            <h1 className="text-balance font-display text-2xl font-medium leading-none text-ink-display sm:text-3xl">
              {title}
            </h1>
          </div>
          <p className="sr-only">
            {title}
            {body}
          </p>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeader({
  actionLabel,
  actionHref,
  body,
  eyebrow,
  title,
}: {
  actionLabel?: string;
  actionHref?: string;
  body?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl font-medium leading-none text-ink-display">
          {title}
        </h2>
        {body ? <p className="sr-only">{body}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <a
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-semibold text-ink-display shadow-sm transition duration-200 ease-premium hover:border-border-accent hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
          href={actionHref}
        >
          {actionLabel}
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

export function MetricCard({
  detail,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  detail: string;
  icon: IconComponent;
  label: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  value: string;
}) {
  return (
    <Card className="group min-w-0 overflow-hidden rounded-lg bg-surface-strong transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:shadow-lift motion-reduce:transition-none">
      <CardContent className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-lg border",
              tone === "neutral" && "border-hairline bg-surface text-ink-muted",
              tone === "accent" &&
                "border-accent bg-accent text-accent-foreground",
              tone === "success" &&
                "border-state-success bg-state-success text-success-foreground",
              tone === "warning" &&
                "border-signal bg-signal text-signal-darker",
              tone === "danger" &&
                "border-state-danger bg-state-danger text-destructive-foreground",
            )}
          >
            <Icon aria-hidden className="size-5" />
          </span>
          <span className="text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {label}
          </span>
        </div>
        <div>
          <strong className="block font-display text-3xl font-medium leading-none text-ink-display">
            {value}
          </strong>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DataPanel({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <Card className={cn("min-w-0 rounded-lg bg-surface-strong", className)}>
      <CardHeader className="p-3.5">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3.5 pt-0">{children}</CardContent>
    </Card>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent" | "whatsapp";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold leading-none",
        tone === "neutral" && "border-hairline bg-surface text-ink-muted",
        tone === "success" &&
          "border-state-success bg-state-success text-success-foreground",
        tone === "warning" &&
          "border-signal bg-signal-faded text-signal-darker",
        tone === "danger" && "border-state-danger bg-surface text-state-danger",
        tone === "accent" && "border-accent bg-accent-faded text-ink-display",
        tone === "whatsapp" &&
          "border-wa-read bg-wa-read text-primary-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline bg-surface p-5 text-center">
      <h3 className="font-display text-xl font-medium text-ink-display">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
    </div>
  );
}
