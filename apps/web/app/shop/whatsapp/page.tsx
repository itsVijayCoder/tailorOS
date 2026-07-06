import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DatabaseZap,
  KeyRound,
  MessageSquareWarning,
  RefreshCw,
  Route,
  ShieldCheck,
  Smartphone,
  UserRoundSearch,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  connectorPolicyChecks,
  formatPaise,
  getWhatsAppConnectorSignals,
  getWhatsAppPolicyBlockBreakdown,
  getWhatsAppTemplateReadiness,
  getWhatsAppWebhookReliability,
  isWhatsAppRequestDeadLettered,
  isWhatsAppRequestRetryable,
  sharedMobileCases,
  whatsAppChannels,
  whatsAppMessageRequests,
  whatsAppTemplateMappings,
  whatsAppUsageLedger,
  whatsAppWebhookEvents,
} from "@/features/core-modules/data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import {
  formatShortDate,
  humanizeStatus,
  statusTone,
} from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "WhatsApp Connector",
};

const connectorFlow = [
  {
    body: "Core modules emit order, trial, pickup, balance, and alteration events.",
    icon: ClipboardList,
    label: "TailorOS events",
  },
  {
    body: "Connector applies tenant channel, consent, template, idempotency, and service-window policy.",
    icon: ShieldCheck,
    label: "Policy gate",
  },
  {
    body: "Queue consumer sends through Meta Cloud API and records provider evidence.",
    icon: DatabaseZap,
    label: "Queue worker",
  },
  {
    body: "Signed webhooks update status rank, usage ledger, opt-out, and inbound routing.",
    icon: Route,
    label: "Webhook loop",
  },
] as const;

const launchReadiness = [
  {
    detail: "Signature, verify-token hash, duplicate event, and stale status handling are visible.",
    label: "Webhook safety",
    state: "pass",
  },
  {
    detail: "Opt-out and missing templates block sends before the provider adapter is called.",
    label: "Policy first",
    state: "pass",
  },
  {
    detail: "One blocked provider channel still needs credential rotation before pilot expansion.",
    label: "Provider readiness",
    state: "block",
  },
  {
    detail: "Shared mobile inbound STOP requires staff scope selection before applying opt-out.",
    label: "Family mobile guard",
    state: "warn",
  },
] as const;

export default function WhatsAppConnectorPage() {
  const signals = getWhatsAppConnectorSignals();
  const templateReadiness = getWhatsAppTemplateReadiness();
  const webhookReliability = getWhatsAppWebhookReliability();
  const policyBlocks = getWhatsAppPolicyBlockBreakdown();

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }))}
              href="/admin/design-system"
            >
              Design tokens
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Button>
              Retry queue
              <RefreshCw aria-hidden className="size-4" />
            </Button>
          </>
        }
        body="A connector cockpit for Phase 06: provider credentials stay outside shop workflows, while operators can see channel health, template readiness, policy blocks, queue state, webhook evidence, and usage cost."
        eyebrow="Phase 06 connector"
        title="WhatsApp operations with policy before automation."
      />

      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={`${signals.degradedChannels} channel(s) need platform support`}
            icon={Smartphone}
            label="Active channels"
            tone={signals.degradedChannels > 0 ? "warning" : "success"}
            value={`${signals.activeChannels}/${whatsAppChannels.length}`}
          />
          <MetricCard
            detail={`${signals.templatesNeedingReview} pending, paused, or missing mappings`}
            icon={BadgeCheck}
            label="Approved templates"
            tone={signals.templatesNeedingReview > 0 ? "warning" : "success"}
            value={`${templateReadiness.approved}/${whatsAppTemplateMappings.length}`}
          />
          <MetricCard
            detail={`${signals.retryableFailures} retryable, ${signals.deadLetteredRequests} in DLQ`}
            icon={MessageSquareWarning}
            label="Queue risk"
            tone={signals.deadLetteredRequests > 0 ? "danger" : "warning"}
            value={`${signals.queueBacklog}`}
          />
          <MetricCard
            detail={`${signals.webhookExceptions} duplicate, stale, or profile-scope events`}
            icon={Activity}
            label="Read rate"
            tone="accent"
            value={`${signals.readRatePct}%`}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
          <DataPanel
            description="The shop UI sees business events and status evidence; provider credentials, templates, rate limits, and retry details remain connector-owned."
            title="Connector topology"
          >
            <div className="grid gap-3 lg:grid-cols-4">
              {connectorFlow.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    className="group relative rounded-lg border border-hairline bg-surface p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                    key={step.label}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent transition duration-200 ease-premium group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      {index < connectorFlow.length - 1 ? (
                        <ArrowRight
                          aria-hidden
                          className="hidden size-4 text-ink-muted lg:block"
                        />
                      ) : (
                        <CheckCircle2
                          aria-hidden
                          className="size-4 text-state-success"
                        />
                      )}
                    </div>
                    <h2 className="mt-4 font-display text-xl font-medium leading-none text-ink-display">
                      {step.label}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-3 rounded-lg border border-hairline bg-signal-faded p-4 text-signal-darker md:grid-cols-[2.5rem_minmax(0,1fr)]">
              <span className="grid size-10 place-items-center rounded-lg border border-signal bg-signal">
                <KeyRound aria-hidden className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xl font-medium text-ink-display">
                  Meta Graph API v25.0, signed webhooks, tenant-scoped D1.
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-body">
                  The implementation keeps Graph version configurable, requires
                  connector secrets, hashes verify tokens, dedupes webhook rows,
                  and uses queue-backed retries before a message reaches staff.
                </p>
              </div>
            </div>
          </DataPanel>

          <DataPanel
            description="These checks mirror the Worker policy package and identify what can block a send."
            title="Policy gate"
          >
            <div className="grid gap-3">
              {connectorPolicyChecks.map((check) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={check.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink-display">
                      {check.label}
                    </span>
                    <StatusBadge tone={statusTone(check.state)}>
                      {humanizeStatus(check.state)}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {check.detail}
                  </p>
                </div>
              ))}
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="Channel rows are intentionally support-focused: they show provider identity, consent coverage, quality rating, token age, and rotation due date without exposing credentials."
            eyebrow="Provider readiness"
            title="Channel health"
          />
          <div className="mt-5 overflow-x-auto rounded-lg border border-hairline bg-surface-strong shadow-raised">
            <table className="w-full min-w-[58rem] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="border-b border-hairline px-4 py-3">Branch</th>
                  <th className="border-b border-hairline px-4 py-3">Provider identity</th>
                  <th className="border-b border-hairline px-4 py-3">Quality</th>
                  <th className="border-b border-hairline px-4 py-3">Consent</th>
                  <th className="border-b border-hairline px-4 py-3">Rotation</th>
                  <th className="border-b border-hairline px-4 py-3">State</th>
                </tr>
              </thead>
              <tbody>
                {whatsAppChannels.map((channel) => (
                  <tr
                    className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                    key={channel.id}
                  >
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <strong className="block text-ink-display">
                        {channel.branchLabel}
                      </strong>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {channel.tenantCode} · {channel.displayPhone}
                      </span>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <span className="block font-ui text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Meta Cloud API
                      </span>
                      <span className="mt-1 block text-xs text-ink-body">
                        Phone {channel.phoneNumberId}
                      </span>
                      <span className="mt-1 block text-xs text-ink-muted">
                        WABA {channel.wabaId}
                      </span>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <StatusBadge tone={qualityTone(channel.qualityRating)}>
                        {humanizeStatus(channel.qualityRating)}
                      </StatusBadge>
                      <p className="mt-2 text-xs leading-5 text-ink-muted">
                        {channel.messagingLimitTier}
                      </p>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-ui font-semibold text-ink-display">
                          {channel.consentCoveragePct}%
                        </span>
                        <span className="text-xs text-ink-muted">opt-in</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-panel">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-premium motion-reduce:transition-none"
                          style={{ width: `${channel.consentCoveragePct}%` }}
                        />
                      </div>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <span className="block text-sm font-semibold text-ink-display">
                        {formatShortDate(channel.tokenRotationDue)}
                      </span>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {channel.credentialAgeDays} days old
                      </span>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <StatusBadge tone={statusTone(channel.status)}>
                        {humanizeStatus(channel.status)}
                      </StatusBadge>
                      {channel.risk ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-ink-muted">
                          {channel.risk}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
          <DataPanel
            description="Template purpose is product-owned, but provider template names and review states are connector-owned."
            title="Template mapping board"
          >
            <div className="grid gap-3">
              {whatsAppTemplateMappings.map((template) => (
                <div
                  className="grid gap-3 rounded-lg border border-hairline bg-surface p-3 md:grid-cols-[minmax(0,1fr)_9rem]"
                  key={template.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={statusTone(template.status)}>
                        {humanizeStatus(template.status)}
                      </StatusBadge>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {template.category} · {template.language.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="mt-3 truncate font-ui text-sm font-semibold text-ink-display">
                      {template.providerTemplateName}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {humanizeStatus(template.purpose)} · {template.variables.length} variables · fallback {humanizeStatus(template.fallback)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-body">
                      {template.ownerAction}
                    </p>
                  </div>
                  <div className="rounded-lg bg-page px-3 py-2 text-sm">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Synced
                    </span>
                    <strong className="mt-1 block text-ink-display">
                      {formatDateTime(template.lastSyncedAt)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Blocked sends are terminal until staff fixes the reason; retryable failures stay queue-owned."
            title="Outbox and queue"
          >
            <div className="grid gap-3">
              {whatsAppMessageRequests.map((request) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={request.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={statusTone(request.status)}>
                        {humanizeStatus(request.status)}
                      </StatusBadge>
                      {isWhatsAppRequestRetryable(request) ? (
                        <StatusBadge tone="warning">Retryable</StatusBadge>
                      ) : null}
                      {isWhatsAppRequestDeadLettered(request) ? (
                        <StatusBadge tone="danger">DLQ</StatusBadge>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {request.orderCode}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1">
                    <strong className="text-sm text-ink-display">
                      {humanizeStatus(request.purpose)} · {request.customerName}
                    </strong>
                    <span className="text-xs text-ink-muted">
                      {request.productEvent} · retries {request.retryCount}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {request.reason}
                  </p>
                  {request.staffAction ? (
                    <p className="mt-2 rounded-lg bg-signal-faded px-3 py-2 text-xs font-semibold leading-5 text-signal-darker">
                      {request.staffAction}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="Webhook processing preserves status rank and keeps duplicate, stale, and ambiguous inbound events auditable."
            title="Webhook evidence timeline"
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <ReliabilityStat
                label="Applied"
                value={`${webhookReliability.applied}`}
              />
              <ReliabilityStat
                label="Duplicate"
                value={`${webhookReliability.duplicateIgnored}`}
              />
              <ReliabilityStat
                label="Stale"
                value={`${webhookReliability.staleIgnored}`}
              />
              <ReliabilityStat
                label="Profile scope"
                value={`${webhookReliability.profileSelection}`}
              />
            </div>
            <div className="grid gap-3">
              {whatsAppWebhookEvents.map((event) => (
                <div
                  className="grid gap-3 rounded-lg border border-hairline bg-surface p-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]"
                  key={event.id}
                >
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {formatDateTime(event.receivedAt)}
                    </span>
                    <StatusBadge tone={statusTone(event.handling)}>
                      {humanizeStatus(event.handling)}
                    </StatusBadge>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={statusTone(event.normalizedStatus)}>
                        {humanizeStatus(event.normalizedStatus)}
                      </StatusBadge>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {humanizeStatus(event.eventType)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {event.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Mobile number is a contact channel, not a customer identity."
            title="Shared mobile safety"
          >
            <div className="grid gap-3">
              {sharedMobileCases.map((item) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserRoundSearch
                      aria-hidden
                      className="mt-0.5 size-5 text-accent"
                    />
                    <StatusBadge tone={statusTone(item.resolution)}>
                      {humanizeStatus(item.resolution)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium text-ink-display">
                    {item.mobileDisplay}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-body">
                    <span aria-hidden>&quot;</span>
                    {item.inboundText}
                    <span aria-hidden>&quot;</span>
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">
                    {item.candidateProfiles.join(", ")}
                  </p>
                  <p className="mt-3 rounded-lg bg-page px-3 py-2 text-sm leading-6 text-ink-muted">
                    {item.decision}
                  </p>
                </div>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <DataPanel
            description="Estimated cost is derived from immutable usage rows rather than provider dashboard screenshots."
            title="Usage ledger"
          >
            <div className="grid gap-3">
              {whatsAppUsageLedger.map((line) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={line.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink-display">
                      {line.tenantCode}
                    </span>
                    <span className="font-ui text-sm font-bold text-ink-display">
                      {formatPaise(line.estimatedCostPaise)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">
                    {line.period} · {line.templateMessages} template messages ·{" "}
                    {line.utilityConversations + line.serviceConversations} conversations
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">
                    {line.evidence}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-hairline bg-accent-faded p-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Month estimate
                </span>
                <strong className="mt-1 block font-display text-3xl font-medium leading-none text-ink-display">
                  {formatPaise(signals.estimatedCostPaise)}
                </strong>
              </div>
            </div>
          </DataPanel>

          <div className="grid gap-5">
            <DataPanel
              description="Blocked request counts are grouped by the operator-facing reason."
              title="Policy block breakdown"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {policyBlocks.map((block) => (
                  <div
                    className="rounded-lg border border-hairline bg-surface p-4"
                    key={block.label}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {block.label}
                    </span>
                    <strong className="mt-2 block font-display text-3xl font-medium leading-none text-ink-display">
                      {block.count}
                    </strong>
                  </div>
                ))}
              </div>
            </DataPanel>

            <DataPanel
              description="The remaining blockers are visible before pilot expansion."
              title="Launch readiness"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {launchReadiness.map((item) => (
                  <div
                    className="rounded-lg border border-hairline bg-surface p-4"
                    key={item.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink-display">
                        {item.state === "pass" ? (
                          <CheckCircle2
                            aria-hidden
                            className="size-4 text-state-success"
                          />
                        ) : item.state === "warn" ? (
                          <Clock3 aria-hidden className="size-4 text-signal-darker" />
                        ) : (
                          <BellRing
                            aria-hidden
                            className="size-4 text-state-danger"
                          />
                        )}
                        {item.label}
                      </span>
                      <StatusBadge tone={statusTone(item.state)}>
                        {humanizeStatus(item.state)}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </DataPanel>
          </div>
        </section>
      </div>
    </>
  );
}

function ReliabilityStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-page p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <strong className="mt-1 block font-display text-2xl font-medium leading-none text-ink-display">
        {value}
      </strong>
    </div>
  );
}

function qualityTone(quality: "green" | "yellow" | "red") {
  if (quality === "green") {
    return "success" as const;
  }

  if (quality === "yellow") {
    return "warning" as const;
  }

  return "danger" as const;
}

function formatDateTime(input: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(input));
}
