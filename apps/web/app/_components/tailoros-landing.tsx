import {
  ArrowUpRight,
  CalendarClock,
  ClipboardCheck,
  Command,
  CreditCard,
  MessageSquareText,
  Ruler,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  Workflow,
} from "lucide-react";

import {
  AnimatedBadge,
  Container,
  CTASection,
  GlassCard,
  HorizontalScrollSection,
  ImageReveal,
  Marquee,
  MobileMenu,
  PremiumButton,
  PremiumCard,
  Section,
  SectionHeading,
  StickyFeatureShowcase,
  TestimonialCard,
  TransitionLink,
} from "@/components/premium";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { href: "#platform", label: "Platform" },
  { href: "#workflow", label: "Workflow" },
  { href: "#signals", label: "Signals" },
  { href: "/admin/tenants", label: "Control plane" },
  { href: "/admin/design-system", label: "Design system" },
];

const marqueeItems = [
  "Orders",
  "Measurements",
  "Fittings",
  "WhatsApp",
  "Receipts",
  "Delivery",
  "Ledger",
  "Multi-tenant",
];

const platformFeatures = [
  {
    body: "Orders, garments, payments, delivery dates, alteration requests, and fitting notes stay connected to the customer and tenant that created them.",
    eyebrow: "Counter command",
    icon: Command,
    metric: "4 core lanes",
    title: "Every shop-floor decision gets a trusted source of truth.",
  },
  {
    body: "TailorOS keeps measurement versions, relationships, repeat preferences, and previous orders visible before the next conversation begins.",
    eyebrow: "Customer memory",
    icon: UsersRound,
    metric: "360 profile",
    title: "Profiles remember bodies, garments, families, and history.",
  },
  {
    body: "Incoming chat, fit confirmations, delivery nudges, and payment follow-ups are designed to become traceable work, not scattered messages.",
    eyebrow: "Conversation continuity",
    icon: MessageSquareText,
    metric: "Phase 02 ready",
    title: "WhatsApp work moves with operational context.",
  },
  {
    body: "Data boundaries, status changes, and high-value actions are shaped for multi-tenant shops before the product surface becomes crowded.",
    eyebrow: "Tenant-safe foundation",
    icon: ShieldCheck,
    metric: "Strict by design",
    title: "The system is designed around isolation and auditability.",
  },
];

const workflowItems = [
  {
    body: "Create a customer, confirm intent, and attach WhatsApp context without leaving the operating surface.",
    icon: MessageSquareText,
    label: "01",
    stat: "2 min",
    title: "Capture the enquiry",
  },
  {
    body: "Record measurement sets, preserve versions, and keep garment-specific deviations visible for the next fitting.",
    icon: Ruler,
    label: "02",
    stat: "18+ fields",
    title: "Measure with confidence",
  },
  {
    body: "Route garments through cutting, stitching, alteration, trial, and finish with status clarity for the counter team.",
    icon: Workflow,
    label: "03",
    stat: "5 stages",
    title: "Plan production",
  },
  {
    body: "Surface fittings, late balances, and delivery risk before they become customer escalations.",
    icon: CalendarClock,
    label: "04",
    stat: "Live queue",
    title: "Protect the promise date",
  },
  {
    body: "Generate receipts, track settlement, and retain complete order memory for future repeat work.",
    icon: CreditCard,
    label: "05",
    stat: "Clean handoff",
    title: "Close the loop",
  },
];

const signalCards = [
  {
    body: "Dense enough for repeated operations, restrained enough for teams to trust it all day.",
    icon: Store,
    title: "Premium dashboard density",
  },
  {
    body: "Forms and summaries prioritize exact values, historical comparison, and garment context.",
    icon: ScanLine,
    title: "Measurement-first patterns",
  },
  {
    body: "Architecture, docs, tests, and UI stay aligned as each phase adds new surface area.",
    icon: ClipboardCheck,
    title: "Phase-wise build discipline",
  },
];

const testimonials = [
  {
    body: "The product feels built for the way a tailoring counter actually works: quick lookup, precise promises, and no missing context.",
    name: "Aarav Mehta",
    role: "Bespoke menswear operator",
  },
  {
    body: "The strongest part is the customer memory. Repeat orders stop depending on who remembers the last fitting conversation.",
    name: "Nisha Rao",
    role: "Studio operations lead",
  },
  {
    body: "It gives the team a calm rhythm. Every order has a visible next action, owner, balance, and date.",
    name: "Kabir Sethi",
    role: "Tailoring workflow consultant",
  },
];

const heroStats = [
  { label: "Orders in motion", value: "284" },
  { label: "Fittings due", value: "18" },
  { label: "On-time risk", value: "06" },
];

export function TailorOSLanding() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Header />
      <HeroSection />
      <Marquee items={marqueeItems} />
      <StickyFeatureShowcase features={platformFeatures} />
      <VisualSystemSection />
      <HorizontalScrollSection items={workflowItems} />
      <SignalSection />
      <TestimonialsSection />
      <CTASection
        body="TailorOS Phase 01 now has the foundation for a high-end product surface: strict tokens, reusable UI, route motion, smooth scroll, and product-grade interaction primitives."
        primaryHref="/admin/design-system"
        primaryLabel="View design system"
        secondaryHref="#platform"
        secondaryLabel="Review platform"
        title="Build the next phase on a system that already feels premium."
      />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/72 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between gap-5">
        <TransitionLink className="group flex items-center gap-3" href="/">
          <span className="grid size-11 place-items-center rounded-full border border-border bg-primary text-sm font-bold text-primary-foreground shadow-token transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
            TX
          </span>
          <span className="leading-tight">
            <strong className="block font-display text-lg font-light tracking-tight text-foreground">
              TailorOS
            </strong>
            <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Operating atelier
            </span>
          </span>
        </TransitionLink>

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/55 p-1 shadow-sm backdrop-blur lg:flex">
          {navigation.map((item) => (
            <TransitionLink
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </TransitionLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <PremiumButton href="/admin/design-system" size="md">
            Design system
          </PremiumButton>
          <PremiumButton href="/admin/tenants" size="md" variant="secondary">
            Control plane
          </PremiumButton>
        </div>

        <MobileMenu items={navigation} />
      </Container>
    </header>
  );
}

function HeroSection() {
  return (
    <Section className="relative overflow-hidden pb-16 pt-14 md:pt-20 lg:pb-24 lg:pt-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative z-10 flex flex-col gap-8">
          <AnimatedBadge>
            <Sparkles aria-hidden className="size-4" />
            Phase 01 foundation
          </AnimatedBadge>

          <div className="flex flex-col gap-7" data-reveal>
            <h1 className="text-balance font-display text-6xl font-light leading-[0.88] tracking-tight text-foreground md:text-8xl lg:text-[7.5rem]">
              The operating system for{" "}
              <span className="font-display font-light italic text-primary">
                bespoke
              </span>{" "}
              tailoring.
            </h1>
            <p className="max-w-2xl text-base leading-[1.65] text-muted-foreground md:text-lg">
              TailorOS brings customer memory, measurement precision, order
              orchestration, WhatsApp continuity, and payment discipline into
              one premium platform for modern tailoring teams.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row" data-reveal>
            <PremiumButton href="#platform" size="lg">
              Explore the platform
            </PremiumButton>
            <PremiumButton
              href="/admin/design-system"
              size="lg"
              variant="secondary"
            >
              Open design system
            </PremiumButton>
          </div>

          <div className="grid gap-3 sm:grid-cols-3" data-stagger>
            {heroStats.map((stat) => (
              <GlassCard className="p-4" key={stat.label}>
                <p className="font-display text-4xl font-light tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.label}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="relative" data-parallax="-6">
          <PremiumCard className="p-3 md:p-4">
            <div className="relative z-10 overflow-hidden rounded-[1.45rem] border border-border bg-card/70">
              <ImageReveal
                alt="Dark luxury tailoring atelier with abstract TailorOS dashboard glow"
                height={992}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/media/tailoros-atelier.png"
                width={1586}
              />
              <div className="grid gap-0 border-t border-border bg-background/82 p-4 backdrop-blur-xl md:grid-cols-3 md:p-5">
                {["Lead triage", "Measurement set", "Delivery promise"].map(
                  (item, index) => (
                    <div
                      className="flex items-center gap-3 border-border py-3 md:border-l md:first:border-l-0 md:px-4"
                      key={item}
                    >
                      <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {item}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </PremiumCard>
        </div>
      </Container>
    </Section>
  );
}

function VisualSystemSection() {
  return (
    <Section className="relative" id="visual-system">
      <Container className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="grid gap-5" data-stagger>
          {signalCards.map((card) => {
            const Icon = card.icon;

            return (
              <PremiumCard className="p-6" key={card.title}>
                <div className="relative z-10 flex gap-5">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-secondary text-primary">
                    <Icon aria-hidden className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-light tracking-tight text-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">
                      {card.body}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>

        <div>
          <SectionHeading
            description="The supplied warm atelier palette was converted into shadcn semantic variables, then extended with reusable surfaces, shadows, and status tokens that stay replaceable from globals.css."
            eyebrow="Design system"
            italicTitleWord="semantic"
            title="Luxury visuals, semantic color discipline."
          />
          <div className="mt-8 grid gap-3" data-stagger>
            {[
              "Antique gold primary actions with deep ink text",
              "Copper accent states for warmth and hierarchy",
              "Warm ivory foregrounds and muted linen support text",
              "Glassy cards, grain, radial light, and restrained motion",
            ].map((item) => (
              <div
                className="flex items-center justify-between gap-4 rounded-full border border-border bg-secondary/45 px-5 py-3 text-sm font-semibold text-foreground"
                key={item}
              >
                {item}
                <ArrowUpRight aria-hidden className="size-4 text-primary" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function SignalSection() {
  return (
    <Section id="signals">
      <Container>
        <SectionHeading
          centered
          description="TailorOS is being shaped as a product that can carry real operations: polished enough to sell, structured enough to scale, and direct enough for daily work."
          eyebrow="Operating signals"
          italicTitleWord="premium"
          title="Premium does not mean decorative."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3" data-stagger>
          {[
            {
              body: "High-contrast hierarchy and stable surfaces help staff see what changed, what is late, and what needs confirmation.",
              title: "Fast recognition",
              value: "Scan",
            },
            {
              body: "Animations reveal priority and spatial relationships without turning operational work into spectacle.",
              title: "Measured restraint",
              value: "Motion",
            },
            {
              body: "App pages and docs consume the same semantic colors, keeping future brand changes localized to globals.css.",
              title: "Replaceable theme",
              value: "Tokens",
            },
          ].map((item) => (
            <PremiumCard key={item.title}>
              <div className="relative z-10 flex h-full flex-col justify-between gap-12">
                <p className="font-display text-5xl font-light italic text-primary">
                  {item.value}
                </p>
                <div>
                  <h3 className="font-display text-3xl font-light tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-[1.65] text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function TestimonialsSection() {
  return (
    <Section className="pt-0">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionHeading
            description="The surface is intentionally designed for high-trust client work: fewer loose ends, clearer promises, and a richer service memory."
            eyebrow="Customer confidence"
            italicTitleWord="trust"
            title="Designed for trust at the tailoring counter."
          />
          <div className="grid gap-5 md:grid-cols-3" data-stagger>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
