import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileWarning,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  RefreshCw,
  Route,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tenant Control Plane | TailorOS",
  description:
    "Phase 03 tenant provisioning, D1 registry, worker routing, recovery, and control-plane dashboard for TailorOS.",
};

const navItems = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#provisioning", label: "Provisioning" },
  { href: "#registry", label: "Registry" },
  { href: "#recovery", label: "Recovery" },
];

const metrics = [
  {
    label: "Tenant records",
    value: "12",
    delta: "3 queued",
    icon: Building2,
  },
  {
    label: "Active shops",
    value: "09",
    delta: "healthy dispatch",
    icon: CheckCircle2,
  },
  {
    label: "Needs review",
    value: "02",
    delta: "recoverable",
    icon: FileWarning,
  },
  {
    label: "Schema target",
    value: "v3",
    delta: "tenant baseline",
    icon: Database,
  },
];

const tenants = [
  {
    name: "Sri Raja Tailors",
    slug: "sri-raja-tailors",
    tenantId: "ten_f4a91c83e0104b2d",
    city: "Madurai",
    status: "active",
    plan: "pilot",
    step: "active",
    job: "succeeded",
    attempts: 1,
    schema: 3,
    database: "tailoros_tenant_sri_raja_tailors_f4a91c83",
    worker: "tailoros-tenant-sri-raja-tailors",
    nextAction: "Dispatch allowed",
  },
  {
    name: "Kovai Classic Fits",
    slug: "kovai-classic-fits",
    tenantId: "ten_d9266fa63f554d20",
    city: "Coimbatore",
    status: "failed_migration",
    plan: "starter",
    step: "failed_migration",
    job: "failed",
    attempts: 2,
    schema: 0,
    database: "tailoros_tenant_kovai_classic_fits_d9266fa6",
    worker: "pending",
    nextAction: "Retry migration",
  },
  {
    name: "Velachery Bridal Lab",
    slug: "velachery-bridal-lab",
    tenantId: "ten_32c702e599d940aa",
    city: "Chennai",
    status: "db_creating",
    plan: "growth",
    step: "db_creating",
    job: "running",
    attempts: 1,
    schema: 0,
    database: "pending",
    worker: "pending",
    nextAction: "Await D1 create",
  },
  {
    name: "Aruppukottai Alterations",
    slug: "aruppukottai-alterations",
    tenantId: "ten_8dcadf124f964f09",
    city: "Virudhunagar",
    status: "suspended",
    plan: "pilot",
    step: "active",
    job: "succeeded",
    attempts: 1,
    schema: 3,
    database: "tailoros_tenant_aruppukottai_alterations_8dcadf12",
    worker: "tailoros-tenant-aruppukottai-alterations",
    nextAction: "Dispatch blocked",
  },
];

const lifecycle = [
  { label: "Requested", state: "complete", icon: Clock3 },
  { label: "Owner validation", state: "complete", icon: KeyRound },
  { label: "Tenant reserved", state: "complete", icon: ShieldCheck },
  { label: "D1 creating", state: "active", icon: Database },
  { label: "Migrating", state: "pending", icon: RefreshCw },
  { label: "Defaults seeding", state: "pending", icon: Sparkles },
  { label: "Worker registry", state: "pending", icon: ServerCog },
  { label: "Health check", state: "pending", icon: Activity },
  { label: "Active", state: "pending", icon: CheckCircle2 },
];

const recoveryCards = [
  {
    title: "D1 create succeeds, migration fails",
    body: "Keep the database registry row, mark `failed_migration`, preserve the job error, and requeue only the repair path.",
    icon: Database,
    variant: "warning" as const,
  },
  {
    title: "Signup page refresh",
    body: "Resolve the same idempotency key and return the existing tenant, slug, job, and provisioning URL.",
    icon: RefreshCw,
    variant: "success" as const,
  },
  {
    title: "Suspended tenant dispatch",
    body: "Gateway resolves the slug from the control DB and returns `403` before invoking the tenant Worker.",
    icon: LockKeyhole,
    variant: "danger" as const,
  },
];

const registryRows = [
  {
    label: "CONTROL_DB",
    value: "tailoros_control_local",
    detail: "tenants, jobs, D1 registry, worker registry, audit",
    icon: Database,
  },
  {
    label: "Provision queue",
    value: "tenant-provision-local",
    detail: "signup accepted, background lifecycle, DLQ configured",
    icon: Workflow,
  },
  {
    label: "Migration queue",
    value: "tenant-migration-local",
    detail: "schema version fan-out and repairable tenant migrations",
    icon: RefreshCw,
  },
  {
    label: "Dispatch guard",
    value: "active + healthy only",
    detail: "fails closed when status or worker mapping is unsafe",
    icon: Route,
  },
];

export default function TenantControlPlanePage() {
  return (
    <main className="min-h-screen bg-page text-ink-body">
      <Header />
      <section
        id="dashboard"
        className="border-b border-hairline px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-7 motion-safe:animate-[route-enter_460ms_var(--ease-premium)_both]">
            <Badge variant="signal">
              <ShieldCheck aria-hidden className="size-3.5" />
              Phase 03 control plane
            </Badge>
            <div className="max-w-4xl">
              <h1 className="text-balance font-display text-5xl font-medium leading-[0.95] text-ink-display sm:text-6xl lg:text-7xl">
                Tenant provisioning cockpit for isolated tailor shops.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-muted sm:text-lg">
                Registration, slug reservation, D1 creation, schema migration,
                worker registration, health checks, suspension, and recovery in
                one platform-admin surface.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a className={buttonVariants({ size: "lg" })} href="#registry">
                Review registry
                <ArrowRight aria-hidden className="size-4" />
              </a>
              <Link
                className={buttonVariants({ variant: "secondary", size: "lg" })}
                href="/docs/phase-wise/Phase03_control_plane_tenant_provisioning.html"
              >
                Phase 03 source
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden motion-safe:animate-[route-enter_620ms_var(--ease-premium)_both]">
            <CardHeader>
              <CardTitle>Provisioning intake</CardTitle>
              <CardDescription>
                Current request shape accepted by the control-plane Worker.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shop-name">Shop name</Label>
                <Input id="shop-name" readOnly value="Sri Raja Tailors" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="slug">Preferred slug</Label>
                  <Input id="slug" readOnly value="sri-raja-tailors" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select id="plan" defaultValue="pilot">
                    <option value="pilot">Pilot</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                  </Select>
                </div>
              </div>
              <Callout variant="success">
                <strong className="text-ink-display">Accepted:</strong> request
                returns `202`, a tenant ID, queued job ID, and a stable
                provisioning URL.
              </Callout>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                className="group transition duration-200 ease-premium hover:-translate-y-1 hover:border-border-accent motion-reduce:transition-none"
                key={metric.label}
                style={{ animationDelay: `${index * 65}ms` }}
              >
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-semibold text-ink-muted">
                      {metric.label}
                    </p>
                    <strong className="mt-3 block font-display text-4xl font-medium leading-none text-ink-display">
                      {metric.value}
                    </strong>
                    <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-accent">
                      {metric.delta}
                    </span>
                  </div>
                  <span className="grid size-11 place-items-center rounded-full border border-hairline bg-accent-faded text-accent transition duration-200 group-hover:scale-105 motion-reduce:transition-none">
                    <Icon aria-hidden className="size-5" />
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        id="provisioning"
        className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:px-8 lg:py-14"
      >
        <div>
          <SectionHeading
            eyebrow="State machine"
            title="Queue-backed lifecycle"
            body="Every long-running step is outside the signup request path and leaves a repairable control-plane record."
          />
        </div>
        <div className="grid gap-3">
          {lifecycle.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                className={cn(
                  "group grid gap-4 rounded-xl border border-hairline bg-surface p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none sm:grid-cols-[3rem_1fr_auto]",
                  item.state === "active" &&
                    "border-border-accent bg-signal-faded",
                )}
                key={item.label}
              >
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-full border text-ink-muted",
                    item.state === "complete" &&
                      "border-state-success bg-state-success text-success-foreground",
                    item.state === "active" &&
                      "border-signal bg-signal text-signal-darker",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Step {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium text-ink-display">
                    {item.label}
                  </h2>
                </div>
                <Badge
                  className="self-center"
                  variant={
                    item.state === "complete"
                      ? "success"
                      : item.state === "active"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {item.state}
                </Badge>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="registry"
        className="border-y border-hairline bg-surface/60 px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            eyebrow="Tenant dashboard"
            title="Registry and dispatch status"
            body="Tenant rows expose operational status without leaking database IDs to customer-facing surfaces."
          />

          <div className="mt-8 overflow-hidden rounded-xl border border-hairline bg-page shadow-raised">
            <div className="grid min-w-[920px] grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_1fr] border-b border-hairline bg-surface px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <span>Tenant</span>
              <span>Status</span>
              <span>Provisioning</span>
              <span>Schema</span>
              <span>Attempts</span>
              <span>Next action</span>
            </div>
            <div className="overflow-x-auto">
              {tenants.map((tenant) => (
                <div
                  className="grid min-w-[920px] grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_1fr] items-center gap-4 border-b border-hairline px-5 py-4 last:border-b-0 transition duration-200 ease-premium hover:bg-accent-faded/55 motion-reduce:transition-none"
                  key={tenant.tenantId}
                >
                  <div>
                    <h3 className="font-display text-xl font-medium text-ink-display">
                      {tenant.name}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {tenant.slug} · {tenant.city}
                    </p>
                    <p className="mt-1 font-ui text-xs text-ink-muted">
                      {tenant.tenantId}
                    </p>
                  </div>
                  <TenantBadge status={tenant.status} />
                  <div>
                    <p className="font-semibold text-ink-display">
                      {tenant.step}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">{tenant.job}</p>
                  </div>
                  <Badge variant={tenant.schema > 0 ? "success" : "neutral"}>
                    v{tenant.schema}
                  </Badge>
                  <span className="font-display text-2xl font-medium text-ink-display">
                    {tenant.attempts}
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink-display">
                      {tenant.nextAction}
                    </span>
                    <Link
                      aria-label={`Open ${tenant.name}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                      })}
                      href={`/admin/tenants?tenant=${tenant.slug}`}
                    >
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {registryRows.map((row) => {
              const Icon = row.icon;
              return (
                <Card
                  className="transition duration-200 ease-premium hover:-translate-y-1 hover:border-border-accent motion-reduce:transition-none"
                  key={row.label}
                >
                  <CardHeader>
                    <div className="mb-3 grid size-10 place-items-center rounded-full border border-hairline bg-accent-faded text-accent">
                      <Icon aria-hidden className="size-5" />
                    </div>
                    <CardTitle>{row.label}</CardTitle>
                    <CardDescription>{row.value}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-ink-muted">
                      {row.detail}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="recovery"
        className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8 lg:py-14"
      >
        <div>
          <SectionHeading
            eyebrow="Recovery lanes"
            title="Known edge cases are first-class states"
            body="Phase 03 avoids hidden half-created tenants by making every failure visible, auditable, and retryable from a platform-admin path."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {recoveryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Callout
                  className="transition duration-200 ease-premium hover:-translate-y-1 motion-reduce:transition-none"
                  key={card.title}
                  variant={card.variant}
                >
                  <Icon aria-hidden className="mb-4 size-5" />
                  <h3 className="font-display text-xl font-medium text-ink-display">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6">{card.body}</p>
                </Callout>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manual support packet</CardTitle>
            <CardDescription>
              Admin recovery includes reason codes and audit rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Reason", "migration_repair"],
              ["Actor", "platform_admin"],
              ["Target", "tenant + provisioning_job"],
              ["Outcome", "retry queued or support hold"],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-hairline pb-3 last:border-b-0 last:pb-0"
                key={label}
              >
                <span className="text-sm font-semibold text-ink-muted">
                  {label}
                </span>
                <span className="font-ui text-sm font-semibold text-ink-display">
                  {value}
                </span>
              </div>
            ))}
            <Link
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full justify-center",
              )}
              href="/docs/runbooks/phase03-control-plane-tenant-provisioning.md"
            >
              <LifeBuoy aria-hidden className="size-4" />
              Recovery runbook
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-page/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link className="group flex items-center gap-3" href="/">
          <span className="grid size-10 place-items-center rounded-full border border-hairline bg-accent text-sm font-bold text-accent-foreground shadow-token transition duration-200 ease-premium group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none">
            TX
          </span>
          <span className="leading-tight">
            <strong className="block font-display text-lg font-medium leading-none text-ink-display">
              TailorOS
            </strong>
            <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Control plane
            </span>
          </span>
        </Link>
        <nav
          aria-label="Control-plane sections"
          className="hidden items-center gap-1 rounded-full border border-hairline bg-surface p-1 shadow-sm lg:flex"
        >
          {navItems.map((item) => (
            <a
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "hidden sm:inline-flex",
            )}
            href="/admin/design-system"
          >
            Design system
          </Link>
        </div>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-ink-display sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-ink-muted">{body}</p>
    </div>
  );
}

function TenantBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge variant="success">active</Badge>;
  }

  if (status === "suspended") {
    return <Badge variant="destructive">suspended</Badge>;
  }

  if (status.startsWith("failed") || status === "needs_manual_review") {
    return <Badge variant="warning">{status}</Badge>;
  }

  return <Badge variant="neutral">{status}</Badge>;
}
