import { Quote } from "lucide-react";

import { PremiumCard } from "@/components/premium/premium-card";

type TestimonialCardProps = {
  body: string;
  name: string;
  role: string;
};

export function TestimonialCard({ body, name, role }: TestimonialCardProps) {
  return (
    <PremiumCard className="flex h-full flex-col justify-between gap-10">
      <Quote aria-hidden className="relative z-10 size-8 text-primary" />
      <blockquote className="relative z-10 text-xl leading-[1.55] text-foreground">
        “{body}”
      </blockquote>
      <div className="relative z-10 border-t border-border pt-5">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{role}</p>
      </div>
    </PremiumCard>
  );
}
