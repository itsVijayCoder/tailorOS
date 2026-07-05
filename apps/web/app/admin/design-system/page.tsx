import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Blocks,
  CircleDot,
  Layers3,
  Moon,
  Sparkles,
  Type,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "TailorOS design-system reference for tokens, primitives, motion, and Phase 01 UI standards.",
};

const colors = [
  { name: "Background", className: "bg-background", value: "--background" },
  { name: "Card", className: "bg-card", value: "--card" },
  { name: "Primary", className: "bg-primary", value: "--primary" },
  { name: "Accent", className: "bg-accent", value: "--accent" },
  { name: "Warning", className: "bg-warning", value: "--warning" },
  { name: "Border", className: "bg-border", value: "--border" },
];

const principles = [
  {
    title: "Operational density",
    body: "Dashboards should prioritize scanning, comparison, and repeated counter workflows.",
    icon: Layers3,
  },
  {
    title: "Token discipline",
    body: "Use shadcn semantic tokens for background, card, primary, secondary, muted, accent, border, and status states.",
    icon: CircleDot,
  },
  {
    title: "Motion with restraint",
    body: "Micro-interactions use transform and opacity, with reduced-motion fallbacks from CSS.",
    icon: Sparkles,
  },
];

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/86 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link className="group flex items-center gap-3" href="/">
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-token transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              TX
            </span>
            <span className="leading-tight">
              <strong className="block font-display text-base font-semibold text-foreground">
                TailorOS
              </strong>
              <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Design system
              </span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10 lg:py-16">
        <div className="motion-safe:animate-[fade-up_700ms_cubic-bezier(.2,.8,.2,1)_both]">
          <Badge variant="accent">
            <BadgeCheck aria-hidden className="size-3.5" />
            Phase 01 reference
          </Badge>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-none text-foreground sm:text-6xl">
            Premium operating UI for tailor-shop workflows.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            This page anchors the shared TailorOS visual language until Phase 02
            expands the component library. Build with these tokens and
            primitives before introducing one-off UI.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button">
              Core primitives
              <ArrowUpRight aria-hidden className="size-4" />
            </Button>
            <a
              className="action-button secondary"
              href="/docs/phase-wise/Phase02_design_system_ui_foundation.html"
            >
              Open Phase 02 report
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </div>
        </div>

        <aside className="rounded-lg border border-border bg-card/80 p-5 shadow-soft motion-safe:animate-[fade-up_850ms_cubic-bezier(.2,.8,.2,1)_both]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Theme
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                Light and dark ready
              </h2>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-primary">
              <Moon aria-hidden className="size-5" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The toggle writes to local storage and the layout boot script
            applies the saved class before paint.
          </p>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <article
                className="rounded-lg border border-border bg-card/80 p-5 shadow-raised transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lift"
                key={principle.title}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Icon aria-hidden className="size-5 text-primary" />
                <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {principle.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {principle.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-20 sm:px-8 lg:grid-cols-2 lg:px-10">
        <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Blocks aria-hidden className="size-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Color tokens
            </h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {colors.map((color) => (
              <div
                className="rounded-lg border border-border bg-muted p-3"
                key={color.name}
              >
                <div
                  className={`h-16 rounded-md border border-border ${color.className}`}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <strong className="text-sm text-foreground">
                    {color.name}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {color.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Type aria-hidden className="size-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Primitives
            </h2>
          </div>
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-wrap gap-3">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="signal">Signal</Button>
              <Button size="icon" variant="ghost" aria-label="Spark">
                <Sparkles aria-hidden className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="signal">Signal</Badge>
              <Badge variant="solid">Solid</Badge>
            </div>
            <div className="grid gap-2">
              <label htmlFor="design-system-search">Search input</label>
              <Input
                id="design-system-search"
                placeholder="Mobile, order ID, receipt ID"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
