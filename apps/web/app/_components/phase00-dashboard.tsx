import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Milestone,
  PanelTop,
} from "lucide-react";
import type { CSSProperties } from "react";

import {
  heroStats,
  phases,
  qualityPrinciples,
  sequence,
  sourceDocs,
  strategicInsights,
} from "@/app/_data/phase00";
import type { Phase } from "@/app/_data/phase00";

const navItems = [
  { href: "#overview", label: "Overview" },
  { href: "#phase-map", label: "Phase map" },
  { href: "#sequence", label: "Sequence" },
  { href: "#quality", label: "Quality" },
  { href: "#sources", label: "Sources" },
];

export function Phase00Dashboard() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="page-ambient" />
      <SiteHeader />
      <section
        id="overview"
        className="relative mx-auto grid w-full max-w-7xl gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10 lg:pb-24 lg:pt-12"
      >
        <div className="motion-safe:animate-[fade-up_700ms_cubic-bezier(.2,.8,.2,1)_both]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm backdrop-blur">
            <Milestone aria-hidden className="size-4 text-primary" />
            TailorOS implementation handbook - Master
          </div>
          <h1 className="max-w-5xl font-display text-5xl font-light leading-[0.95] text-foreground sm:text-6xl lg:text-7xl">
            Phase-wise Implementation Master Index
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
            A premium command center for the complete TailorOS and WhatsApp
            Connector implementation pack, synthesized from the product PRDs and
            the phase-wise engineering reports.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="action-button primary" href="#phase-map">
              Explore phase map
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
            <a
              className="action-button secondary"
              href="/docs/phase-wise/Phase01_architecture_foundation.html"
            >
              Open Phase 01
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </div>
        </div>

        <aside className="hero-panel motion-safe:animate-[fade-up_850ms_cubic-bezier(.2,.8,.2,1)_both] lg:mt-4">
          <div className="hero-panel-glow" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Implementation status
                </p>
                <h2 className="mt-3 font-display text-2xl font-light text-foreground">
                  Ready for Phase 01 execution
                </h2>
              </div>
              <div className="rounded-2xl border border-border bg-accent p-3 text-accent-foreground">
                <PanelTop aria-hidden className="size-6" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {heroStats.map((stat) => (
                <div
                  className="rounded-2xl border border-border bg-card/70 p-4 shadow-raised"
                  key={stat.label}
                >
                  <strong className="block font-display text-3xl font-light text-foreground">
                    {stat.value}
                  </strong>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm leading-6 text-foreground">
                The build sequence is intentionally conservative: establish
                architecture and UI foundations, lock tenant and domain
                invariants, validate the shop OS, then connect WhatsApp.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {strategicInsights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <article
                className="insight-card"
                key={insight.title}
                style={{ "--delay": `${index * 70}ms` } as CSSProperties}
              >
                <Icon aria-hidden className="size-5 text-primary" />
                <h2>{insight.title}</h2>
                <p>{insight.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="phase-map"
        className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10"
      >
        <SectionHeading
          eyebrow="Master index"
          title="Phase map"
          body="Each phase is a standalone implementation handoff, but the dependencies matter. The map below keeps the sequence, exit gates, and source reports visible."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {phases.map((phase, index) => (
            <PhaseCard index={index} key={phase.number} phase={phase} />
          ))}
        </div>
      </section>

      <section
        id="sequence"
        className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10"
      >
        <SectionHeading
          eyebrow="Recommended build order"
          title="Sequence that reduces rework"
          body="The order protects the riskiest assumptions first: tenant boundaries, data truth, shop adoption, messaging policy, then launch hardening."
        />
        <div className="sequence-rail mt-10">
          {sequence.map((item, index) => (
            <article
              className="sequence-step"
              key={item.label}
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
            >
              <span>{item.range}</span>
              <h3>{item.label}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="quality"
        className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10"
      >
        <div className="quality-panel">
          <SectionHeading
            eyebrow="Senior engineering bar"
            title="Quality principles used"
            body="Phase00 is not just navigation. It is the contract for how the implementation should protect maintainability, tenant trust, and pilot reliability."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {qualityPrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <article className="quality-card" key={principle.title}>
                  <div className="quality-icon">
                    <Icon aria-hidden className="size-5" />
                  </div>
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="sources"
        className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10"
      >
        <SectionHeading
          eyebrow="Traceability"
          title="Source map and documentation basis"
          body="The app links below are served from the original documentation pack so the master index remains auditable while the homepage becomes the premium operating view."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {sourceDocs.map((source) => (
            <a
              className="source-card group"
              href={source.href}
              key={source.title}
            >
              <div className="source-icon">
                <FileText aria-hidden className="size-5" />
              </div>
              <div>
                <span>{source.kind}</span>
                <h3>{source.title}</h3>
                <p>{source.note}</p>
              </div>
              <ArrowUpRight
                aria-hidden
                className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/86 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <a className="group flex items-center gap-3" href="#overview">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-token transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
            TX
          </span>
          <span className="leading-tight">
            <strong className="block font-display text-base font-light text-foreground">
              TailorOS
            </strong>
            <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Phase 00
            </span>
          </span>
        </a>
        <nav
          aria-label="Primary sections"
          className="hidden items-center rounded-full border border-border bg-background/70 p-1 shadow-sm md:flex"
        >
          {navItems.map((item) => (
            <a
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl font-light tracking-normal text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
        {body}
      </p>
    </div>
  );
}

function PhaseCard({ phase, index }: { phase: Phase; index: number }) {
  const Icon = phase.icon;

  return (
    <article
      className="phase-card"
      style={{ "--delay": `${index * 55}ms` } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="phase-number">{phase.number}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {phase.category}
            </p>
            <h3 className="mt-1 font-display text-xl font-light text-foreground">
              {phase.shortTitle}
            </h3>
          </div>
        </div>
        <div className="phase-icon">
          <Icon aria-hidden className="size-5" />
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-foreground">{phase.lead}</p>
      <div className="mt-5 rounded-2xl border border-border bg-muted/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Outcome
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground">
          {phase.outcome}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {phase.tags.map((tag) => (
          <span className="phase-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-3 border-t border-border pt-5">
        <CheckCircle2
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
        <p className="text-sm leading-6 text-muted-foreground">{phase.gate}</p>
      </div>
      <a className="phase-report-link group/link" href={phase.href}>
        Open implementation report
        <ArrowUpRight
          aria-hidden
          className="size-4 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
        />
      </a>
    </article>
  );
}
