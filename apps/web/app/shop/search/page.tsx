import type { Metadata } from "next";
import {
  Bolt,
  Clock3,
  DatabaseZap,
  Gauge,
  ListChecks,
  MousePointer2,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CoreCommandMenu } from "@/features/core-modules/components/core-command-menu";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import {
  getSearchPerformanceSignals,
  searchPilotRecords,
} from "@/features/core-modules/data";

export const metadata: Metadata = {
  title: "Global Search and Performance",
  description:
    "Phase 07 tenant-local global search, exact lookup indexes, FTS fallback, and fast command UX for TailorOS.",
};

const strategyRows = [
  {
    input: "98765",
    strategy: "mobile prefix",
    target: "<80ms",
    result: "Family, profiles, and active orders tied to the shared mobile.",
  },
  {
    input: "ORD-MDU-000421",
    strategy: "exact code",
    target: "<50ms",
    result: "Order row first, receipt/customer context after.",
  },
  {
    input: "Meena blouse",
    strategy: "FTS prefix",
    target: "<150ms",
    result: "Ranked customer, measurement, order, and WhatsApp evidence.",
  },
  {
    input: "today delivery",
    strategy: "shortcut",
    target: "<120ms",
    result: "Status/date indexed list without scanning dashboard history.",
  },
];

const edgeCases = [
  "One shared mobile returns a family row before individual profiles.",
  "One-character queries stay idle to avoid noisy backend work.",
  "Receipt and order codes are exact-indexed before FTS fallback.",
  "WhatsApp logs are searchable as projection summaries, not raw payload scans.",
  "Stale command-palette responses are ignored after newer keystrokes.",
  "Read replication should use D1 Sessions when read-after-write matters.",
];

const sampleQueries = [
  "98765",
  "CUS-MDU-000231",
  "ORD-MDU-000421",
  "today delivery",
];

export default function SearchPerformancePage() {
  const signals = getSearchPerformanceSignals();

  return (
    <>
      <PageHeader
        actions={
          <>
            <CoreCommandMenu />
            <a
              className={buttonVariants({ variant: "secondary", size: "lg" })}
              href="/docs/phase-wise/Phase07_global_search_performance.html"
            >
              Phase 07 source
            </a>
          </>
        }
        body="Tenant-local global search now uses exact indexed paths before FTS, keeps command search responsive, and documents the speed budget that matters at the shop counter."
        eyebrow="Phase 07 search and speed"
        title="Find the customer, order, receipt, or WhatsApp evidence before choosing a module."
      />

      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Exact order/customer/receipt code target"
            icon={DatabaseZap}
            label="Code lookup"
            tone="accent"
            value={`${signals.exactOrderBudgetMs}ms`}
          />
          <MetricCard
            detail="Normalized exact or prefix mobile path"
            icon={Bolt}
            label="Mobile"
            tone="success"
            value={`${signals.mobileBudgetMs}ms`}
          />
          <MetricCard
            detail="Name, garment, status, and message fallback"
            icon={Search}
            label="FTS"
            tone="warning"
            value={`${signals.ftsBudgetMs}ms`}
          />
          <MetricCard
            detail="Shared mobile prefix pilot result count"
            icon={Gauge}
            label="Pilot hits"
            tone="neutral"
            value={`${signals.sharedMobileResults}`}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="The command surface mirrors the tenant API contract: normalize first, run indexed exact paths, then fall back to FTS only when the query is free text."
            title="Search strategy contract"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline pb-3 pr-4">
                      Input
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Strategy
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Budget
                    </th>
                    <th className="border-b border-hairline pb-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {strategyRows.map((row) => (
                    <tr
                      className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                      key={row.input}
                    >
                      <td className="border-b border-hairline py-4 pr-4 align-top font-semibold text-ink-display">
                        {row.input}
                      </td>
                      <td className="border-b border-hairline py-4 pr-4 align-top">
                        <StatusBadge tone="accent">{row.strategy}</StatusBadge>
                      </td>
                      <td className="border-b border-hairline py-4 pr-4 align-top text-ink-muted">
                        {row.target}
                      </td>
                      <td className="border-b border-hairline py-4 align-top text-ink-muted">
                        {row.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>

          <DataPanel title="Command UX guarantees">
            <div className="grid gap-3">
              {[
                ["150ms", "Debounce window before backend work"],
                ["0", "Stale responses allowed to overwrite UI"],
                ["5", "Recent cached results kept on device"],
                ["2+", "Minimum query length before search"],
              ].map(([value, label]) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={label}
                >
                  <strong className="block font-display text-2xl font-medium leading-none text-ink-display">
                    {value}
                  </strong>
                  <span className="mt-1 block text-sm leading-5 text-ink-muted">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="These samples use the same pilot fixture behind the command palette. Exact matches stay above text matches so staff can move quickly during counter work."
            eyebrow="Pilot projection"
            title="Sample search outcomes"
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {sampleQueries.map((query) => {
              const results = searchPilotRecords(query);
              const first = results[0];

              return (
                <article
                  className="rounded-lg border border-hairline bg-surface-strong p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:shadow-lift motion-reduce:transition-none"
                  key={query}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <MousePointer2 aria-hidden className="size-5" />
                    </span>
                    <StatusBadge
                      tone={first?.hitType === "exact" ? "success" : "warning"}
                    >
                      {first?.hitType ?? "idle"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-medium text-ink-display">
                    {query}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {first
                      ? `${first.title} via ${first.matchedOn}`
                      : "No result in pilot projection."}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <DataPanel title="Edge-case checklist">
            <div className="grid gap-3 text-sm leading-6">
              {edgeCases.map((edgeCase) => (
                <div
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 rounded-lg border border-hairline bg-surface p-3 text-ink-muted"
                  key={edgeCase}
                >
                  <ListChecks
                    aria-hidden
                    className="mt-0.5 size-4 text-accent"
                  />
                  <span>{edgeCase}</span>
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Platform-wide search should be a replayable projection, not fan-out queries across tenant databases."
            title="Projection pipeline"
          >
            <div className="grid gap-4 md:grid-cols-4">
              {[
                [
                  Network,
                  "Tenant write",
                  "Contact, order, receipt, payment, or message event.",
                ],
                [
                  TimerReset,
                  "Projection event",
                  "Idempotent update queued after the domain write.",
                ],
                [
                  ShieldCheck,
                  "Control search DB",
                  "Non-sensitive support index only.",
                ],
                [
                  Sparkles,
                  "Scoped support",
                  "Admin opens tenant context after audited access.",
                ],
              ].map(([Icon, title, body]) => {
                const PipelineIcon = Icon as typeof Network;

                return (
                  <div
                    className="rounded-lg border border-hairline bg-surface p-4"
                    key={title as string}
                  >
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <PipelineIcon aria-hidden className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-medium text-ink-display">
                      {title as string}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {body as string}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-lg border border-hairline bg-signal-faded p-4">
              <Badge variant="signal">
                <Clock3 aria-hidden className="size-3.5" />
                Performance rule
              </Badge>
              <p className="mt-3 text-sm leading-6 text-ink-body">
                Optimize the shop path first: mobile search, profile selection,
                order or measurement, then payment and receipt. Decorative
                dashboards stay secondary to counter speed.
              </p>
            </div>
          </DataPanel>
        </section>
      </div>
    </>
  );
}
