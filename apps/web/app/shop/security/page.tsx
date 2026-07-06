import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Download,
  EyeOff,
  FileClock,
  Fingerprint,
  GlobeLock,
  History,
  KeyRound,
  LockKeyhole,
  ReceiptText,
  ServerCog,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  auditCoverageRows,
  credentialVaultRecords,
  getPhase08SecuritySignals,
  publicEndpointControls,
  receiptAccessCases,
  securityRoleRows,
  supportAccessCases,
  tenantIsolationChecks,
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
  title: "Security, Privacy and RBAC",
  description:
    "Phase 08 security, privacy, tenant isolation, RBAC, credential vaulting, signed access, audit coverage, and public endpoint hardening for TailorOS.",
};

const authorizationFlow = [
  {
    body: "Authenticate staff or platform support before any tenant route can read operational data.",
    icon: Fingerprint,
    label: "Session",
  },
  {
    body: "Resolve tenant from trusted host/path plus membership, never from request body tenant_id.",
    icon: DatabaseZap,
    label: "Tenant membership",
  },
  {
    body: "Check action permission against the role matrix before mutation or export.",
    icon: UsersRound,
    label: "RBAC",
  },
  {
    body: "Invoke only the tenant worker bound to that shop's D1 database and R2 namespace.",
    icon: ServerCog,
    label: "Tenant binding",
  },
  {
    body: "Record sensitive changes, support access, credential updates, exports, and deletes.",
    icon: History,
    label: "Audit",
  },
] as const;

const launchChecklist = [
  {
    label: "RBAC matrix",
    state: "pass",
    text: "Implemented in @tailoros/core and covered by unit tests.",
  },
  {
    label: "Tenant mismatch",
    state: "pass",
    text: "Cross-tenant membership mismatch returns a denial before role checks.",
  },
  {
    label: "Credential masking",
    state: "pass",
    text: "Public views expose only masked WABA/phone IDs and token health state.",
  },
  {
    label: "Signed access",
    state: "pass",
    text: "Receipt/media access rejects expired links, invalid signatures, and missing confirmations.",
  },
  {
    label: "Support access",
    state: "pass",
    text: "Support requires tenant scope, reason, active grant, and future expiry.",
  },
  {
    label: "Production login",
    state: "warn",
    text: "A real session provider and membership repository still need to wrap live tenant data.",
  },
  {
    label: "Audit writes",
    state: "warn",
    text: "Audit action policy exists; D1 write-through must be connected when auth lands.",
  },
] as const;

export default function SecurityPrivacyRbacPage() {
  const signals = getPhase08SecuritySignals();

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }))}
              href="/docs/phase-wise/Phase08_security_privacy_rbac.html"
            >
              Phase 08 source
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/admin/design-system"
            >
              Design tokens
              <ShieldCheck aria-hidden className="size-4" />
            </Link>
          </>
        }
        body="Phase 08 turns security into an operating workspace: staff roles, tenant boundaries, masked credentials, signed media, public endpoint controls, support windows, and audit coverage are visible before real shop data is trusted to TailorOS."
        eyebrow="Phase 08 security"
        title="Tenant isolation, privacy, and role gates before automation."
      />

      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            detail={`${signals.blockedCriticalEdges} critical role/permission edges blocked`}
            icon={UsersRound}
            label="RBAC roles"
            tone="success"
            value={`${signals.roles}`}
          />
          <MetricCard
            detail={`${signals.tenantControlsPassing}/${tenantIsolationChecks.length} controls pass now`}
            icon={LockKeyhole}
            label="Tenant controls"
            tone={
              signals.tenantControlsPassing === tenantIsolationChecks.length
                ? "success"
                : "warning"
            }
            value={`${signals.tenantControlsPassing}`}
          />
          <MetricCard
            detail={`${signals.rawCredentialExposureCount} raw identifiers in public views`}
            icon={EyeOff}
            label="Credential vault"
            tone={
              signals.rawCredentialExposureCount === 0 ? "success" : "danger"
            }
            value={`${signals.credentialRecords}`}
          />
          <MetricCard
            detail={`${signals.supportAccessAlerts} support/access alerts, ${signals.receiptAccessBlocks} signed-link blocks`}
            icon={GlobeLock}
            label="Access risk"
            tone={signals.supportAccessAlerts > 0 ? "warning" : "success"}
            value={`${signals.publicEndpointGaps}`}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <DataPanel
            description="Phase 08 separates identity, membership, role, tenant binding, and audit into independent gates so one bypass cannot expose another shop's data."
            title="Authorization pipeline"
          >
            <div className="grid gap-3 lg:grid-cols-5">
              {authorizationFlow.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    className="group rounded-lg border border-hairline bg-surface p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                    key={step.label}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent transition duration-200 ease-premium group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      {index < authorizationFlow.length - 1 ? (
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
          </DataPanel>

          <DataPanel
            description="These rows distinguish what is implemented today from the production controls that need the future session provider and D1 audit write-through."
            title="Tenant isolation checks"
          >
            <div className="grid gap-3">
              {tenantIsolationChecks.map((check) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={check.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {check.layer}
                      </span>
                      <h2 className="mt-1 text-sm font-semibold text-ink-display">
                        {check.title}
                      </h2>
                    </div>
                    <StatusBadge tone={statusTone(check.state)}>
                      {humanizeStatus(check.state)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {check.evidence}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="The matrix is intentionally operational: it protects the actions TailorOS staff repeat daily instead of hiding behind generic admin/editor labels."
            eyebrow="RBAC"
            title="Role and permission matrix"
          />
          <div className="mt-5 overflow-x-auto rounded-lg border border-hairline bg-surface-strong shadow-raised">
            <table className="w-full min-w-[72rem] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="border-b border-hairline px-4 py-3">Role</th>
                  <th className="border-b border-hairline px-4 py-3">Scope</th>
                  <th className="border-b border-hairline px-4 py-3">
                    Allowed
                  </th>
                  <th className="border-b border-hairline px-4 py-3">
                    Blocked by default
                  </th>
                  <th className="border-b border-hairline px-4 py-3">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                {securityRoleRows.map((row) => (
                  <tr
                    className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                    key={row.role}
                  >
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <strong className="block font-display text-xl font-medium text-ink-display">
                        {row.label}
                      </strong>
                      <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {row.role}
                      </span>
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top text-ink-muted">
                      {row.scope}
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <ChipList items={row.allowedHighlights} tone="success" />
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <ChipList items={row.blockedHighlights} tone="danger" />
                    </td>
                    <td className="border-b border-hairline px-4 py-4 align-top">
                      <span className="block font-ui text-sm font-semibold text-ink-display">
                        {row.permissions.length} permissions
                      </span>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-panel">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-premium motion-reduce:transition-none"
                          style={{
                            width: `${Math.min(100, row.permissions.length * 4)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="Health checks return enough to debug validity, expiry, and permission issues without exposing access tokens, app secrets, or raw verify tokens."
            title="Credential vault view"
          >
            <div className="grid gap-3">
              {credentialVaultRecords.map((record) => (
                <article
                  className="grid gap-3 rounded-lg border border-hairline bg-surface p-4 md:grid-cols-[minmax(0,1fr)_12rem]"
                  key={record.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={credentialTone(record.tokenStatus)}>
                        {humanizeStatus(record.tokenStatus)}
                      </StatusBadge>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        masked identifiers
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-xl font-medium text-ink-display">
                      {record.channelLabel}
                    </h2>
                    <div className="mt-3 grid gap-2 text-sm text-ink-muted sm:grid-cols-2">
                      <span>Business {record.businessId}</span>
                      <span>Phone {record.phoneNumberId}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-body">
                      {record.healthSummary}
                    </p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-page p-3">
                    <KeyRound aria-hidden className="mb-3 size-5 text-accent" />
                    <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Rotate by
                    </span>
                    <strong className="mt-1 block text-sm text-ink-display">
                      {formatDateTime(record.tokenRotationDueAt)}
                    </strong>
                    <span className="mt-2 block text-xs leading-5 text-ink-muted">
                      Last {formatDateTime(record.tokenLastRotatedAt)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Support can help, but only inside a scoped and expiring tenant window."
            title="Support access"
          >
            <div className="grid gap-3">
              {supportAccessCases.map((item) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserRoundCheck
                      aria-hidden
                      className="mt-0.5 size-5 text-accent"
                    />
                    <StatusBadge tone={decisionTone(item.decision.allowed)}>
                      {humanizeStatus(item.decision.reason)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-ink-display">
                    {item.actor}
                  </h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {item.tenantCode} · {formatDateTime(item.expiresAt)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {item.reason}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <DataPanel
            description="R2 access is treated as authorization, not a public file path."
            title="Receipt, media and export links"
          >
            <div className="grid gap-3">
              {receiptAccessCases.map((item) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <ReceiptText
                      aria-hidden
                      className="mt-0.5 size-5 text-accent"
                    />
                    <StatusBadge tone={decisionTone(item.decision.allowed)}>
                      {humanizeStatus(item.decision.reason)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium text-ink-display">
                    {item.asset}
                  </h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {item.storage}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {item.retention}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Public routes need abuse controls before they become the path to real tenant data."
            title="Public endpoint hardening"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {publicEndpointControls.map((control) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={control.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <GlobeLock aria-hidden className="size-5 text-accent" />
                    <StatusBadge tone={statusTone(control.state)}>
                      {humanizeStatus(control.state)}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium text-ink-display">
                    {control.endpoint}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-body">
                    {control.protection}
                  </p>
                  <p className="mt-3 rounded-lg bg-page px-3 py-2 text-xs leading-5 text-ink-muted">
                    Prevents: {control.failureMode}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="Audit coverage focuses on dispute-sensitive work: measurements, payments, exports, credentials, support access, and privacy deletion."
            title="Audit coverage"
          >
            <div className="grid gap-3">
              {auditCoverageRows.map((row) => (
                <article
                  className="grid gap-3 rounded-lg border border-hairline bg-surface p-3 md:grid-cols-[10rem_minmax(0,1fr)_8rem]"
                  key={row.id}
                >
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {row.actor}
                    </span>
                    <strong className="mt-1 block text-sm text-ink-display">
                      {row.action}
                    </strong>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-ink-display">
                      {row.record}
                    </span>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {row.evidence}
                    </p>
                  </div>
                  <div className="flex md:justify-end">
                    <StatusBadge tone={statusTone(row.state)}>
                      {humanizeStatus(row.state)}
                    </StatusBadge>
                  </div>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="This is the implementation edge map after Phase 08."
            title="Launch checklist"
          >
            <div className="grid gap-3">
              {launchChecklist.map((item) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={item.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink-display">
                      {item.state === "pass" ? (
                        <CheckCircle2
                          aria-hidden
                          className="size-4 text-state-success"
                        />
                      ) : (
                        <Clock3
                          aria-hidden
                          className="size-4 text-signal-darker"
                        />
                      )}
                      {item.label}
                    </span>
                    <StatusBadge tone={statusTone(item.state)}>
                      {humanizeStatus(item.state)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid gap-4 rounded-lg border border-hairline bg-signal-faded p-5 text-signal-darker md:grid-cols-[2.5rem_minmax(0,1fr)]">
          <span className="grid size-10 place-items-center rounded-lg border border-signal bg-signal">
            <AlertTriangle aria-hidden className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-medium text-ink-display">
              Production rule: no tenant data route should trust request body
              tenant IDs.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-ink-body">
              The policy module now models that boundary. The next backend step
              is to connect a real session provider, membership repository, and
              D1 audit writer around live tenant routes before importing pilot
              customer, measurement, receipt, or WhatsApp data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="success">
                <Download aria-hidden className="mr-1 size-3.5" />
                Owner exports only
              </StatusBadge>
              <StatusBadge tone="accent">
                <FileClock aria-hidden className="mr-1 size-3.5" />
                Expiring signed links
              </StatusBadge>
              <StatusBadge tone="warning">
                <LockKeyhole aria-hidden className="mr-1 size-3.5" />
                Session provider pending
              </StatusBadge>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ChipList({
  items,
  tone,
}: {
  items: readonly string[];
  tone: "success" | "danger";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <StatusBadge key={item} tone={tone}>
          {item}
        </StatusBadge>
      ))}
    </div>
  );
}

function decisionTone(allowed: boolean) {
  return allowed ? "success" : "danger";
}

function credentialTone(
  status: "valid" | "invalid" | "expired" | "permission_issue",
) {
  if (status === "valid") {
    return "success" as const;
  }

  if (status === "permission_issue") {
    return "warning" as const;
  }

  return "danger" as const;
}

function formatDateTime(input: string) {
  const timestamp = new Date(input).getTime();

  if (!Number.isFinite(timestamp)) {
    return input;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(timestamp));
}
