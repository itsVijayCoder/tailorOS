import type { Metadata } from "next";
import {
  AlertTriangle,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FlaskConical,
  Gauge,
  GitBranch,
  ListChecks,
  RadioTower,
  Rocket,
  Siren,
  TestTube2,
} from "lucide-react";

import {
  getPhase09BlockingReleaseGates,
  getPhase09ReleaseSignals,
  phase09FixtureRecords,
  phase09ObservabilityMetrics,
  phase09PilotGoLiveChecks,
  phase09ReleaseGates,
  phase09Runbooks,
  phase09StructuredLogFields,
  phase09TestingLayers,
  phase09WorkerRuntimeChecks,
} from "@/features/core-modules/data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import { humanizeStatus, statusTone } from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Release",
  description:
    "Testing, observability, QA gates, runbooks, and first-shop release readiness for TailorOS.",
};

export default function ReleaseReadinessPage() {
  const signals = getPhase09ReleaseSignals();
  const blockingGates = getPhase09BlockingReleaseGates();

  return (
    <>
      <PageHeader
        body="The test pyramid, fixture coverage, Worker telemetry, release gates, alerts, runbooks, and first-shop pilot checks stay visible before production traffic is trusted."
        eyebrow="Release"
        title="Ship when tests, telemetry, and pilot gates agree."
      />

      <div className="grid min-w-0 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={`${signals.fixtureRecords} realistic shop fixtures cover family, payment, delivery, and webhook edges`}
            icon={TestTube2}
            label="Testing layers"
            tone="accent"
            value={`${signals.testingLayers}`}
          />
          <MetricCard
            detail={`${signals.structuredLogFields} required log dimensions for tenant/request/order traceability`}
            icon={RadioTower}
            label="Log fields"
            tone="success"
            value={`${signals.structuredLogFields}`}
          />
          <MetricCard
            detail={`${signals.warningReleaseGates} warnings and ${signals.blockedReleaseGates} blockers remain`}
            icon={GitBranch}
            label="Release gates"
            tone={signals.blockedReleaseGates > 0 ? "danger" : "success"}
            value={`${signals.passingReleaseGates}/${signals.releaseGates}`}
          />
          <MetricCard
            detail={`${signals.runbooks} support playbooks, ${signals.pilotChecksReady}/${phase09PilotGoLiveChecks.length} pilot checks ready`}
            icon={BookOpenCheck}
            label="Runbook coverage"
            tone={signals.criticalAlerts > 0 ? "warning" : "success"}
            value={`${signals.runbooks}`}
          />
        </section>

        <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(23rem,0.75fr)]">
          <DataPanel
            description="Pull requests, staging, manual approval, production deploy, post-deploy smoke, and monitoring are represented as explicit gates."
            title="Release pipeline"
          >
            <div className="grid gap-3 lg:grid-cols-3">
              {phase09ReleaseGates.map((gate) => (
                <article
                  className="group rounded-lg border border-hairline bg-surface p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                  key={gate.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-lg border border-hairline bg-page font-ui text-sm font-bold text-accent">
                      {gate.order}
                    </span>
                    <StatusBadge tone={statusTone(gate.state)}>
                      {humanizeStatus(gate.state)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-4 text-sm font-semibold text-ink-display">
                    {gate.label}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">
                    {gate.evidence}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {gate.owner}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Blocking gates are intentionally loud because they should stop manual release approval."
            title="Current blockers"
          >
            <div className="grid gap-3">
              {blockingGates.map((gate) => (
                <article
                  className="rounded-lg border border-state-danger bg-surface p-4"
                  key={gate.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Siren
                      aria-hidden
                      className="size-5 shrink-0 text-state-danger"
                    />
                    <StatusBadge tone="danger">
                      {humanizeStatus(gate.state)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium leading-none text-ink-display">
                    {gate.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {gate.evidence}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(21rem,0.8fr)_minmax(0,1.2fr)]">
          <DataPanel
            description="The runtime log contract follows the Phase 09 rule: tenant, request, user, order/message, route, duration, D1 rows, worker, and release version must be queryable."
            title="Structured log contract"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {phase09StructuredLogFields.map((field) => (
                <span
                  className="rounded-lg border border-hairline bg-page px-3 py-2 font-ui text-xs font-semibold text-ink-display"
                  key={field}
                >
                  {field}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-hairline bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-display">
                <DatabaseZap aria-hidden className="size-4 text-accent" />
                Example trace target
              </div>
              <p className="mt-3 font-mono text-xs leading-6 text-ink-muted">
                POST /v1/orders · req_01j · ten_01j · usr_01j · ORD-MDU-000421 ·
                42ms · D1 12/7 · 2026.07.06.1
              </p>
            </div>
          </DataPanel>

          <DataPanel
            description="Metrics map directly to actions so alerts become operational work, not dashboard decoration."
            title="Metrics and alerts"
          >
            <div className="max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface-strong">
              <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline px-4 py-3">
                      Metric
                    </th>
                    <th className="border-b border-hairline px-4 py-3">
                      Current
                    </th>
                    <th className="border-b border-hairline px-4 py-3">
                      Threshold
                    </th>
                    <th className="border-b border-hairline px-4 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {phase09ObservabilityMetrics.map((metric) => (
                    <tr
                      className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                      key={metric.id}
                    >
                      <td className="border-b border-hairline px-4 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <Gauge aria-hidden className="size-4 text-accent" />
                          <span className="font-semibold text-ink-display">
                            {metric.label}
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-hairline px-4 py-4 align-top">
                        <StatusBadge tone={statusTone(metric.state)}>
                          {metric.value}
                        </StatusBadge>
                      </td>
                      <td className="border-b border-hairline px-4 py-4 align-top text-ink-muted">
                        {metric.threshold}
                      </td>
                      <td className="border-b border-hairline px-4 py-4 align-top text-ink-body">
                        {metric.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>
        </section>

        <section className="min-w-0">
          <SectionHeader
            body="Each layer has a narrow owner and a concrete example tied to TailorOS domains."
            eyebrow="Test pyramid"
            title="Coverage strategy"
          />
          <div className="mt-5 max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface-strong shadow-raised">
            <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="border-b border-hairline px-4 py-3">Layer</th>
                  <th className="border-b border-hairline px-4 py-3">Tool</th>
                  <th className="border-b border-hairline px-4 py-3">
                    Coverage
                  </th>
                  <th className="border-b border-hairline px-4 py-3">
                    Example
                  </th>
                  <th className="border-b border-hairline px-4 py-3">State</th>
                </tr>
              </thead>
              <tbody>
                {phase09TestingLayers.map((layer) => (
                  <tr
                    className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                    key={layer.layer}
                  >
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <strong className="block font-display text-xl font-medium text-ink-display">
                        {layer.layer}
                      </strong>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top text-ink-body">
                      {layer.tool}
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top text-ink-muted">
                      {layer.coverage}
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top text-ink-body">
                      {layer.example}
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <StatusBadge tone={statusTone(layer.state)}>
                        {humanizeStatus(layer.state)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
          <DataPanel
            description="Fixtures are concrete Tamil Nadu tailor-shop edge cases, not generic placeholder data."
            title="Fixture coverage"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {phase09FixtureRecords.map((fixture) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none"
                  key={fixture.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <FlaskConical aria-hidden className="size-5 text-accent" />
                    <StatusBadge tone="accent">{fixture.owner}</StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium leading-none text-ink-display">
                    {fixture.edgeCase}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {fixture.assertion}
                  </p>
                  <p className="mt-3 truncate font-mono text-xs text-ink-muted">
                    {fixture.path}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Runtime checks align with the Worker configs and shared runtime package."
            title="Worker runtime readiness"
          >
            <div className="grid gap-3">
              {phase09WorkerRuntimeChecks.map((check) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={check.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {check.worker}
                      </span>
                      <h2 className="mt-1 text-sm font-semibold text-ink-display">
                        {check.check}
                      </h2>
                    </div>
                    <StatusBadge tone={statusTone(check.state)}>
                      {humanizeStatus(check.state)}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {check.evidence}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="min-w-0">
          <SectionHeader
            body="Support playbooks cover the failures most likely to break trust during a first-shop pilot."
            eyebrow="Runbooks"
            title="Incident and support playbooks"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {phase09Runbooks.map((runbook) => (
              <article
                className="rounded-lg border border-hairline bg-surface-strong p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:shadow-raised motion-reduce:transition-none"
                key={runbook.id}
              >
                <div className="flex items-start justify-between gap-3">
                  {runbook.state === "pass" ? (
                    <CheckCircle2
                      aria-hidden
                      className="size-5 text-state-success"
                    />
                  ) : (
                    <AlertTriangle
                      aria-hidden
                      className="size-5 text-signal-darker"
                    />
                  )}
                  <StatusBadge tone={statusTone(runbook.state)}>
                    {runbook.owner}
                  </StatusBadge>
                </div>
                <h2 className="mt-3 font-display text-xl font-medium leading-none text-ink-display">
                  {runbook.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {runbook.trigger}
                </p>
                <p className="mt-3 rounded-lg border border-hairline bg-page p-3 text-sm leading-6 text-ink-body">
                  {runbook.firstAction}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.75fr)]">
          <DataPanel
            description="A shop can go live only after settings, import, staff training, notebook comparison, metrics, and weekly review are accounted for."
            title="First-shop go-live checklist"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {phase09PilotGoLiveChecks.map((check) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={check.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <ListChecks aria-hidden className="size-5 text-accent" />
                    <StatusBadge tone={statusTone(check.state)}>
                      {humanizeStatus(check.state)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-ink-display">
                    {check.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {check.evidence}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Phase 09 is complete for a pilot only when release state and shop readiness converge."
            title="Launch posture"
          >
            <div className="grid gap-3">
              {[
                {
                  body: "Shared mobile, payment correction, partial delivery, duplicate webhook, and stale status fixtures are available.",
                  icon: ClipboardCheck,
                  state: "pass",
                  title: "Edge cases covered",
                },
                {
                  body: "Critical DLQ and smoke-test blockers remain visible before manual release approval.",
                  icon: BellRing,
                  state: "block",
                  title: "Release not production-ready",
                },
                {
                  body: "Pilot still needs historical import, staff training, and two-week notebook comparison evidence.",
                  icon: Rocket,
                  state: "warn",
                  title: "First-shop readiness",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    className="rounded-lg border border-hairline bg-surface p-4"
                    key={item.title}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Icon aria-hidden className="size-5 text-accent" />
                      <StatusBadge tone={statusTone(item.state)}>
                        {humanizeStatus(item.state)}
                      </StatusBadge>
                    </div>
                    <h2 className="mt-3 font-display text-xl font-medium leading-none text-ink-display">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {item.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </DataPanel>
        </section>
      </div>
    </>
  );
}
