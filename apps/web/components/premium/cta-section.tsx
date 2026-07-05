import { Sparkles } from "lucide-react";

import { Container } from "@/components/premium/container";
import { PremiumButton } from "@/components/premium/premium-button";
import { Section } from "@/components/premium/section";

type CTASectionProps = {
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  title: string;
};

export function CTASection({
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  title,
}: CTASectionProps) {
  return (
    <Section className="pt-0">
      <Container>
        <div
          className="premium-card relative overflow-hidden rounded-[2rem] px-6 py-12 text-center shadow-lift md:px-12 md:py-16"
          data-reveal
        >
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles aria-hidden className="size-4" />
              Phase-ready foundation
            </span>
            <h2 className="text-balance font-ui text-5xl font-semibold leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-[1.65] text-muted-foreground md:text-lg">
              {body}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PremiumButton href={primaryHref} size="lg">
                {primaryLabel}
              </PremiumButton>
              <PremiumButton href={secondaryHref} size="lg" variant="secondary">
                {secondaryLabel}
              </PremiumButton>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
