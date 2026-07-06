import type { ComponentType } from "react";

import { Container } from "@/components/premium/container";
import { PremiumCard } from "@/components/premium/premium-card";
import { Section } from "@/components/premium/section";
import { SectionHeading } from "@/components/premium/section-heading";
import { cn } from "@/lib/utils";

type HorizontalItem = {
  body: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  stat: string;
  title: string;
};

type HorizontalScrollSectionProps = {
  className?: string;
  items: HorizontalItem[];
};

export function HorizontalScrollSection({
  className,
  items,
}: HorizontalScrollSectionProps) {
  return (
    <Section
      className={cn("overflow-hidden", className)}
      data-horizontal
      id="workflow"
    >
      <Container>
        <SectionHeading
          description="Each stage keeps the next decision visible, from the first WhatsApp lead to final delivery and repeat customer recall."
          eyebrow="Execution flow"
          italicTitleWord="handoff"
          title="A calmer handoff from enquiry to delivery."
        />
      </Container>
      <div className="mt-12 overflow-visible px-4 sm:px-6 lg:px-10">
        <div
          className="grid gap-5 lg:flex lg:w-max"
          data-horizontal-track
          data-stagger
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <PremiumCard
                className="min-h-[24rem] w-full max-w-none p-7 lg:w-[25rem]"
                key={item.title}
              >
                <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                  <div className="flex items-start justify-between gap-5">
                    <div className="grid size-12 place-items-center rounded-2xl border border-border bg-secondary text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full border border-border bg-secondary/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-5xl font-light tracking-tight text-primary">
                      {item.stat}
                    </p>
                    <h3 className="mt-5 font-display text-3xl font-light tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-[1.65] text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
