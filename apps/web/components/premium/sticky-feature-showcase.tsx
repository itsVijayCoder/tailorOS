import { ArrowUpRight } from "lucide-react";
import type { ComponentType } from "react";

import { Container } from "@/components/premium/container";
import { GlassCard } from "@/components/premium/glass-card";
import { Section } from "@/components/premium/section";
import { SectionHeading } from "@/components/premium/section-heading";
import { cn } from "@/lib/utils";

type StickyFeature = {
  body: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  metric: string;
  title: string;
};

type StickyFeatureShowcaseProps = {
  className?: string;
  features: StickyFeature[];
};

export function StickyFeatureShowcase({
  className,
  features,
}: StickyFeatureShowcaseProps) {
  return (
    <Section className={cn("relative", className)} id="platform">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <SectionHeading
            description="A focused operating layer for tailor shops that need customer memory, order precision, WhatsApp continuity, and audit-ready execution without stitched-together tools."
            eyebrow="Platform intelligence"
            italicTitleWord="shop"
            title="Built around the rhythm of the shop floor."
          />
        </div>
        <div className="grid gap-5" data-stagger>
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <GlassCard
                className="group grid gap-6 p-6 transition duration-500 hover:border-border-accent md:grid-cols-[auto_1fr_auto] md:items-start md:p-7"
                key={feature.title}
              >
                <div className="grid size-12 place-items-center rounded-2xl border border-border bg-secondary text-primary transition duration-300 group-hover:border-border-accent">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {feature.eyebrow}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-light tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.65] text-muted-foreground md:text-base">
                    {feature.body}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                  {feature.metric}
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
