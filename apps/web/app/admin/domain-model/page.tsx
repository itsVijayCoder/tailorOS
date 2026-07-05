import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BadgeIndianRupee,
  BookOpenCheck,
  Boxes,
  ClipboardCheck,
  Database,
  Fingerprint,
  History,
  Layers3,
  MessageSquareMore,
  Phone,
  ReceiptText,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
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
import { StatusChip } from "@/components/ui/status-chip";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Phase 04 Tenant Domain Model",
  description:
    "TailorOS Phase 04 tenant D1 schema, domain services, invariants, search projection, outbox, audit, and operational edge-case reference.",
};

const navItems = [
  { href: "#model", label: "Model" },
  { href: "#schema", label: "Schema" },
  { href: "#invariants", label: "Invariants" },
  { href: "#flow", label: "Flow" },
  { href: "#api", label: "API" },
  { href: "#edge-cases", label: "Edges" },
];

const metrics = [
  {
    label: "Tenant tables",
    value: "22",
    detail: "including search, audit, outbox",
    icon: Database,
  },
  {
    label: "Seed garments",
    value: "08",
    detail: "blouse, pant, uniform, alteration",
    icon: Boxes,
  },
  {
    label: "Domain services",
    value: "04",
    detail: "contacts, measurements, orders, payments",
    icon: Layers3,
  },
  {
    label: "Invariant tests",
    value: "09",
    detail: "API, service, migration smoke",
    icon: ClipboardCheck,
  },
];

const domainNodes = [
  {
    title: "Contact channel",
    label: "customer_contacts",
    body: "Phone and WhatsApp opt-in live here. A shared family mobile never owns measurements directly.",
    icon: Phone,
  },
  {
    title: "Customer identity",
    label: "customer_profiles",
    body: "Each measured person has a stable customer code under the shared contact.",
    icon: UserRoundCheck,
  },
  {
    title: "Measurement history",
    label: "measurement_versions",
    body: "Every edit inserts a version and advances the profile pointer without rewriting old rows.",
    icon: History,
  },
  {
    title: "Order record",
    label: "orders + order_items",
    body: "Orders hold customer identity, item-level statuses, dates, totals, and item snapshots.",
    icon: ReceiptText,
  },
  {
    title: "Ledger money",
    label: "payments + receipts",
    body: "Advance, balance, refund, and correction rows recalculate balance with audit evidence.",
    icon: BadgeIndianRupee,
  },
  {
    title: "Traceability",
    label: "outbox + audit + search",
    body: "Business events, audit records, and FTS projection make actions recoverable and searchable.",
    icon: ScanSearch,
  },
];

const schemaGroups = [
  {
    title: "Contacts and Family",
    tables: [
      "customer_contacts",
      "contact_phone_history",
      "customer_profiles",
    ],
    signal: "Mobile as channel",
  },
  {
    title: "Tailoring",
    tables: [
      "garment_types",
      "measurement_profiles",
      "measurement_versions",
      "order_measurement_snapshots",
    ],
    signal: "Historical fit records",
  },
  {
    title: "Commerce",
    tables: [
      "orders",
      "order_items",
      "production_tasks",
      "alteration_logs",
      "payments",
      "receipts",
    ],
    signal: "Item workflow and ledger",
  },
  {
    title: "Communication",
    tables: ["notification_logs", "wa_messages", "wa_webhook_events"],
    signal: "Connector trace",
  },
  {
    title: "Support",
    tables: ["outbox_events", "audit_logs", "search_docs", "search_docs_fts"],
    signal: "Recovery and search",
  },
];

const invariants = [
  {
    title: "One mobile, many people",
    status: "covered",
    proof: "Contact/profile split plus duplicate contact guard.",
  },
  {
    title: "Measurements are historical",
    status: "covered",
    proof: "Version insert, current pointer update, order snapshot preservation.",
  },
  {
    title: "Payments are ledger-based",
    status: "covered",
    proof: "Advance, balance, refund, and correction rows drive balance.",
  },
  {
    title: "WhatsApp does not block orders",
    status: "covered",
    proof: "Order service writes outbox rows, provider send remains external.",
  },
  {
    title: "Search is tenant-local",
    status: "covered",
    proof: "D1 FTS projection lives inside the per-tenant database.",
  },
  {
    title: "Migration is repairable",
    status: "partial",
    proof: "Fresh schema smoke tested; fan-out migration runner remains later.",
  },
];

const bookingTrace = [
  {
    label: "Search shared mobile",
    value: "+91 98765 43210",
    detail: "Profiles are shown before measurements.",
    icon: Phone,
  },
  {
    label: "Select exact profile",
    value: "Meena Ravi",
    detail: "Order uses `customer_profile_id`, not phone.",
    icon: Fingerprint,
  },
  {
    label: "Snapshot measurement",
    value: "Blouse v1",
    detail: "Later v2 changes do not alter this order.",
    icon: History,
  },
  {
    label: "Book two items",
    value: "ORD-MDU-...",
    detail: "Each item gets independent workflow state.",
    icon: Boxes,
  },
  {
    label: "Collect advance",
    value: "INR 500",
    detail: "Payment ledger updates receipt and balance.",
    icon: BadgeIndianRupee,
  },
  {
    label: "Emit events",
    value: "ORDER_BOOKED",
    detail: "Outbox feeds receipt and WhatsApp workers.",
    icon: MessageSquareMore,
  },
];

const endpoints = [
  {
    method: "POST",
    path: "/v1/contacts",
    body: "Create one contact with one or many customer profiles.",
  },
  {
    method: "POST",
    path: "/v1/measurements",
    body: "Insert a measurement version and update the current profile pointer.",
  },
  {
    method: "POST",
    path: "/v1/orders",
    body: "Create order, item rows, snapshots, receipt, audit, and outbox events.",
  },
  {
    method: "POST",
    path: "/v1/orders/:orderId/payments",
    body: "Append payment/refund/correction ledger row and refresh balance.",
  },
  {
    method: "GET",
    path: "/v1/search?q=meena",
    body: "Query tenant-local FTS projection for contacts, profiles, and orders.",
  },
];

const edgeCases = [
  "Customer changes phone number: history table keeps aliases searchable.",
  "Duplicate family profile: contact duplicate guard exists; merge workflow remains later.",
  "Simple alteration without measurement: allowed only with explicit reason.",
  "Refund or correction: requires reason and audit row before balance changes.",
  "Old measurement dispute: order item snapshot keeps the booked values.",
  "D1 size growth: files stay in R2; raw message logs can be compacted later.",
];

export default function TenantDomainModelPage() {
  return (
    <main className="min-h-screen bg-page text-ink-body">
      <header className="sticky top-0 z-40 border-b border-hairline bg-page/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a className="group flex items-center gap-3" href="#model">
            <span className="grid size-10 place-items-center rounded-full border border-hairline bg-accent text-sm font-bold text-accent-foreground shadow-token transition duration-200 ease-premium group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none">
              04
            </span>
            <span className="leading-tight">
              <strong className="block font-display text-xl font-medium leading-none text-ink-display">
                Tenant Domain
              </strong>
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                D1 model and services
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 rounded-full border border-hairline bg-surface p-1 shadow-sm lg:flex">
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
              className={buttonVariants({ variant: "secondary", size: "sm" })}
              href="/admin/tenants"
            >
              Phase 03
            </Link>
          </div>
        </div>
      </header>

      <section
        id="model"
        className="border-b border-hairline px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-end">
          <div className="motion-safe:animate-[route-enter_420ms_var(--ease-premium)_both]">
            <Badge variant="signal">
              <ShieldCheck aria-hidden className="size-3.5" />
              Phase 04 implemented
            </Badge>
            <h1 className="mt-5 max-w-5xl text-balance font-display text-5xl font-medium leading-[0.95] text-ink-display sm:text-6xl lg:text-7xl">
              Tenant-isolated domain model for real tailor-shop work.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-ink-muted sm:text-lg">
              Contacts, family profiles, measurement history, item snapshots,
              orders, payments, receipts, search, outbox, and audit are now
              modeled inside the tenant plane.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className={buttonVariants({ size: "lg" })} href="#flow">
                Review booking trace
                <ArrowRight aria-hidden className="size-4" />
              </a>
              <Link
                className={buttonVariants({ variant: "secondary", size: "lg" })}
                href="/docs/phase-wise/Phase04_tenant_domain_model.html"
              >
                Phase 04 source
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden motion-safe:animate-[route-enter_620ms_var(--ease-premium)_both]">
            <CardHeader>
              <CardTitle>Core invariant</CardTitle>
              <CardDescription>
                Mobile is a contact method, never the customer identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                ["Mobile", "customer_contacts"],
                ["Person", "customer_profiles"],
                ["Fit history", "measurement_versions"],
                ["Booked truth", "order_measurement_snapshots"],
              ].map(([label, value]) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-lg border border-hairline bg-surface-strong px-3 py-2"
                  key={label}
                >
                  <span className="text-sm font-semibold text-ink-muted">
                    {label}
                  </span>
                  <strong className="font-ui text-sm text-ink-display">
                    {value}
                  </strong>
                </div>
              ))}
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
                style={{ animationDelay: `${index * 70}ms` }}
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
                      {metric.detail}
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

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:py-14">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 grid gap-1" aria-label="Phase sections">
            {navItems.map((item) => (
              <a
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition duration-200 ease-premium hover:bg-surface hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="grid gap-12">
          <ReferenceSection
            body="The model follows the PRD boundary: operational data belongs to one tenant D1 database, while WhatsApp delivery remains an outbox/connector concern."
            icon={Route}
            id="schema"
            title="Schema Groups"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schemaGroups.map((group) => (
                <Card
                  className="transition duration-200 ease-premium hover:-translate-y-1 hover:border-border-accent motion-reduce:transition-none"
                  key={group.title}
                >
                  <CardHeader>
                    <Badge className="w-fit" variant="neutral">
                      {group.signal}
                    </Badge>
                    <CardTitle>{group.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {group.tables.map((table) => (
                        <div
                          className="rounded-lg border border-hairline bg-surface-strong px-3 py-2 font-ui text-sm font-semibold text-ink-display"
                          key={table}
                        >
                          {table}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ReferenceSection>

          <ReferenceSection
            body="Phase 04 is centered on identity safety and historical truth. These checks are enforced in schema, service logic, and tests."
            icon={BookOpenCheck}
            id="invariants"
            title="Invariant Coverage"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {invariants.map((item) => (
                <div
                  className="flex gap-4 rounded-xl border border-hairline bg-surface p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none"
                  key={item.title}
                >
                  <span
                    className={cn(
                      "mt-1 grid size-9 shrink-0 place-items-center rounded-full border",
                      item.status === "covered"
                        ? "border-state-success bg-state-success text-success-foreground"
                        : "border-signal bg-signal-faded text-signal-darker",
                    )}
                  >
                    <ShieldCheck aria-hidden className="size-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-2xl font-medium leading-none text-ink-display">
                        {item.title}
                      </h3>
                      <Badge
                        variant={item.status === "covered" ? "success" : "warning"}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {item.proof}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ReferenceSection>

          <ReferenceSection
            body="A booking path now has explicit data handoffs from search to profile selection, measurement snapshotting, payment, receipt, outbox, and audit."
            icon={Archive}
            id="flow"
            title="Order Booking Trace"
          >
            <div className="grid gap-3">
              {bookingTrace.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    className="grid gap-4 rounded-xl border border-hairline bg-surface p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none sm:grid-cols-[3rem_minmax(0,1fr)_auto]"
                    key={step.label}
                  >
                    <span className="grid size-12 place-items-center rounded-full border border-hairline bg-accent-faded text-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Step {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-medium leading-none text-ink-display">
                        {step.label}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        {step.detail}
                      </p>
                    </div>
                    <strong className="self-center rounded-full border border-hairline bg-surface-strong px-3 py-2 font-ui text-sm text-ink-display">
                      {step.value}
                    </strong>
                  </div>
                );
              })}
            </div>
          </ReferenceSection>

          <ReferenceSection
            body="The tenant Worker now exposes thin Hono routes that validate input, call domain services, and return the shared TailorOS API envelope."
            icon={Sparkles}
            id="api"
            title="Tenant API Surface"
          >
            <div className="grid gap-3">
              {endpoints.map((endpoint) => (
                <div
                  className="grid gap-3 rounded-xl border border-hairline bg-surface p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none md:grid-cols-[5rem_1fr]"
                  key={`${endpoint.method}-${endpoint.path}`}
                >
                  <Badge className="w-fit" variant="signal">
                    {endpoint.method}
                  </Badge>
                  <div>
                    <code className="font-ui text-sm font-semibold text-ink-display">
                      {endpoint.path}
                    </code>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {endpoint.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Callout className="mt-5" variant="info">
              D1 writes use prepared statements behind the repository and
              multi-row service operations are persisted through `batch()`.
            </Callout>
          </ReferenceSection>

          <ReferenceSection
            body="These product-quality cases are now either covered by code or intentionally documented as next-phase work."
            icon={ShieldCheck}
            id="edge-cases"
            title="Edge Case Register"
          >
            <div className="grid gap-3">
              {edgeCases.map((item) => (
                <div
                  className="flex gap-3 rounded-xl border border-hairline bg-surface p-4"
                  key={item}
                >
                  <StatusChip
                    className="mt-0.5 shrink-0"
                    status={item.includes("later") ? "delayed" : "ready"}
                  />
                  <p className="text-sm leading-6 text-ink-body">{item}</p>
                </div>
              ))}
            </div>
          </ReferenceSection>

          <ReferenceSection
            body="The service layer is deliberately small and typed so later modules can add production board, reports, R2 media, and connector delivery status without rewriting the foundation."
            icon={Layers3}
            id="model-detail"
            title="Domain Map"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {domainNodes.map((node) => {
                const Icon = node.icon;
                return (
                  <Card
                    className="group transition duration-200 ease-premium hover:-translate-y-1 hover:border-border-accent motion-reduce:transition-none"
                    key={node.title}
                  >
                    <CardHeader>
                      <span className="mb-2 grid size-10 place-items-center rounded-lg bg-accent-faded text-accent-darker transition duration-200 group-hover:scale-105 motion-reduce:transition-none">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <CardTitle>{node.title}</CardTitle>
                      <CardDescription>{node.body}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <code className="rounded-full border border-hairline bg-surface-strong px-3 py-1.5 font-ui text-xs font-semibold text-ink-display">
                        {node.label}
                      </code>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ReferenceSection>
        </div>
      </div>
    </main>
  );
}

function ReferenceSection({
  body,
  children,
  icon: Icon,
  id,
  title,
}: {
  body: string;
  children: React.ReactNode;
  icon: typeof Database;
  id: string;
  title: string;
}) {
  return (
    <section className="scroll-mt-24" id={id}>
      <div className="mb-5 flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-hairline bg-surface text-accent shadow-sm">
          <Icon aria-hidden className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Phase 04
          </p>
          <h2 className="mt-1 font-display text-3xl font-medium leading-none text-ink-display sm:text-4xl">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-body">
            {body}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
