import type { Metadata } from "next";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDot,
  Layers3,
  MousePointer2,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";

import {
  AnimatedBadge,
  Container,
  GlassCard,
  PremiumButton,
  PremiumCard,
  Section,
  SectionHeading,
  TransitionLink,
} from "@/components/premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "TailorOS premium design-system reference for shadcn tokens, reusable UI, motion primitives, and Phase 01 standards.",
};

const colors = [
  { name: "Background", className: "bg-background", value: "--background" },
  { name: "Foreground", className: "bg-foreground", value: "--foreground" },
  { name: "Card", className: "bg-card", value: "--card" },
  { name: "Primary", className: "bg-primary", value: "--primary" },
  { name: "Accent", className: "bg-accent", value: "--accent" },
  { name: "Muted", className: "bg-muted", value: "--muted" },
  { name: "Border", className: "bg-border", value: "--border" },
  { name: "Success", className: "bg-success", value: "--success" },
];

const principles = [
  {
    body: "Use semantic shadcn variables for every app surface so the TailorOS brand can be rethemed from globals.css.",
    icon: CircleDot,
    title: "Token-first color",
  },
  {
    body: "Cards, buttons, and badges are composed as reusable primitives before page-level layouts introduce product details.",
    icon: Layers3,
    title: "Reusable system parts",
  },
  {
    body: "Lenis, GSAP ScrollTrigger, magnetic controls, image reveal, and route transitions are opt-in and reduced-motion aware.",
    icon: Sparkles,
    title: "Editorial motion",
  },
];

export default function DesignSystemPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/72 backdrop-blur-xl">
        <Container className="flex h-20 items-center justify-between gap-5">
          <TransitionLink className="group flex items-center gap-3" href="/">
            <span className="grid size-11 place-items-center rounded-full border border-border bg-primary text-sm font-bold text-primary-foreground shadow-token transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
              TX
            </span>
            <span className="leading-tight">
              <strong className="block font-display text-lg font-light text-foreground">
                TailorOS
              </strong>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Design system
              </span>
            </span>
          </TransitionLink>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <PremiumButton
              className="hidden sm:inline-flex"
              href="/"
              variant="secondary"
            >
              Home
            </PremiumButton>
          </div>
        </Container>
      </header>

      <Section className="pb-16 pt-14 md:pt-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-end">
          <div className="flex flex-col gap-7">
            <AnimatedBadge>
              <BadgeCheck aria-hidden className="size-4" />
              Phase 01 reference
            </AnimatedBadge>
            <SectionHeading
              description="This page is the working reference for TailorOS colors, typography, surfaces, buttons, and motion. App and docs surfaces should consume these semantic tokens instead of raw color classes."
              eyebrow="Premium token system"
              italicTitleWord="semantic"
              title="A luxury UI system built on semantic shadcn variables."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <PremiumButton href="#tokens" size="lg">
                Review tokens
              </PremiumButton>
              <PremiumButton href="#components" size="lg" variant="secondary">
                Component rules
              </PremiumButton>
            </div>
          </div>
          <PremiumCard className="p-6" data-parallax="5">
            <div className="relative z-10 flex flex-col gap-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Theme posture
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-light tracking-tight text-foreground">
                    Dark luxury by default, light ready by token.
                  </h2>
                </div>
                <Palette aria-hidden className="size-6 text-primary" />
              </div>
              <p className="text-sm leading-[1.65] text-muted-foreground">
                The supplied OKLCH palette maps directly to shadcn variables,
                while TailorOS-specific surfaces and shadows inherit from those
                same variables.
              </p>
            </div>
          </PremiumCard>
        </Container>
      </Section>

      <Section className="pt-0" id="tokens">
        <Container>
          <div
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
            data-stagger
          >
            {colors.map((color) => (
              <GlassCard className="p-4" key={color.value}>
                <div
                  className={`h-20 rounded-[1.1rem] border border-border ${color.className}`}
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <strong className="text-sm text-foreground">
                    {color.name}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {color.value}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="pt-0" id="components">
        <Container className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-5" data-stagger>
            {principles.map((principle) => {
              const Icon = principle.icon;

              return (
                <PremiumCard className="p-6" key={principle.title}>
                  <div className="relative z-10 flex gap-5">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-secondary text-primary">
                      <Icon aria-hidden className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-light tracking-tight text-foreground">
                        {principle.title}
                      </h2>
                      <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">
                        {principle.body}
                      </p>
                    </div>
                  </div>
                </PremiumCard>
              );
            })}
          </div>

          <PremiumCard className="p-6">
            <div className="relative z-10 grid gap-8">
              <div className="flex items-center gap-3">
                <MousePointer2 aria-hidden className="size-5 text-primary" />
                <h2 className="font-display text-3xl font-light tracking-tight text-foreground">
                  Premium controls
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <PremiumButton>Primary action</PremiumButton>
                <PremiumButton variant="secondary">Secondary</PremiumButton>
                <PremiumButton variant="ghost">Ghost</PremiumButton>
                <PremiumButton variant="dark">Dark premium</PremiumButton>
              </div>

              <div className="grid gap-5 rounded-[1.4rem] border border-border bg-secondary/35 p-5">
                <div className="flex items-center gap-3">
                  <Type aria-hidden className="size-5 text-primary" />
                  <h3 className="font-display text-2xl font-light text-foreground">
                    shadcn compatibility
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button>Core button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="signal">Signal</Button>
                  <Badge>Neutral</Badge>
                  <Badge variant="accent">Accent</Badge>
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-semibold text-foreground"
                    htmlFor="design-system-search"
                  >
                    Search pattern
                  </label>
                  <Input
                    id="design-system-search"
                    placeholder="Customer, mobile, order ID, receipt ID"
                  />
                </div>
              </div>

              <TransitionLink
                className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
                href="/"
              >
                Return to the landing page
                <ArrowUpRight
                  aria-hidden
                  className="size-4 transition group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </TransitionLink>
            </div>
          </PremiumCard>
        </Container>
      </Section>
    </main>
  );
}
