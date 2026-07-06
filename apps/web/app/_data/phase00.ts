import {
  Boxes,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  Layers3,
  LockKeyhole,
  MessageCircle,
  Network,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Phase = {
  number: string;
  title: string;
  shortTitle: string;
  category: string;
  href: string;
  icon: LucideIcon;
  lead: string;
  outcome: string;
  gate: string;
  tags: string[];
};

export type SourceDoc = {
  title: string;
  href: string;
  kind: string;
  note: string;
};

export const heroStats = [
  { value: "10", label: "implementation phases" },
  { value: "2", label: "product boundaries" },
  { value: "5", label: "launch-critical workflows" },
  { value: "1", label: "tenant-safe architecture path" },
];

export const strategicInsights = [
  {
    title: "Build the shop OS first",
    body: "The PRD is clear: order entry, measurements, payments, production status, and owner visibility are the adoption engine. Messaging amplifies clean operations, but it cannot replace them.",
    icon: Workflow,
  },
  {
    title: "Treat mobile as contact, not identity",
    body: "Family-aware records and stable IDs prevent the biggest tailoring failure mode: mixing up profiles, measurements, receipts, and active orders under one shared phone number.",
    icon: Users,
  },
  {
    title: "Keep WhatsApp as a connector product",
    body: "TailorOS emits business events. The connector owns provider policy, credentials, templates, routing, webhooks, delivery state, opt-outs, and tenant usage evidence.",
    icon: MessageCircle,
  },
  {
    title: "Make tenant isolation structural",
    body: "The phase plan anchors on a control plane, per-tenant D1 data boundaries, auditable support access, idempotent work queues, and explicit recovery paths.",
    icon: ShieldCheck,
  },
];

export const phases: Phase[] = [
  {
    number: "01",
    title: "Architecture Foundation and Engineering Standards",
    shortTitle: "Architecture Foundation",
    category: "Foundation",
    href: "/docs/phase-wise/Phase01_architecture_foundation.html",
    icon: Network,
    lead: "Define monorepo boundaries, Cloudflare-first deployment shape, API conventions, and the rules that keep the codebase coherent as features multiply.",
    outcome:
      "A deployable engineering baseline with clear app, worker, domain, adapter, and test boundaries.",
    gate: "Repo structure, coding standards, design patterns, and acceptance checks are documented and testable.",
    tags: ["SOLID", "Cloudflare", "API contracts"],
  },
  {
    number: "02",
    title: "Design System, Premium UI and Micro-interactions",
    shortTitle: "Design System UI",
    category: "Foundation",
    href: "/docs/phase-wise/Phase02_design_system_ui_foundation.html",
    icon: Sparkles,
    lead: "Establish the TailorOS product language, accessible primitives, form behavior, animation rules, and performance budget before screen volume grows.",
    outcome:
      "A reusable UI system for fast counter workflows, dense owner views, and high-trust operational screens.",
    gate: "Tokens, components, keyboard states, loading states, reduced motion, and accessibility checks are ready.",
    tags: ["Tokens", "A11y", "Motion"],
  },
  {
    number: "03",
    title: "Control Plane, Tenant Provisioning and Per-tenant D1",
    shortTitle: "Control Plane",
    category: "Tenancy",
    href: "/docs/phase-wise/Phase03_control_plane_tenant_provisioning.html",
    icon: Route,
    lead: "Create the platform control layer for shops, branches, plans, tenant databases, migrations, seeds, and recovery states.",
    outcome:
      "A repeatable tenant-provisioning flow that can onboard real shops without manual database drift.",
    gate: "Provisioning state machine handles retries, partial failures, tenant lookup, migration status, and audit trails.",
    tags: ["Tenant lifecycle", "D1", "State machine"],
  },
  {
    number: "04",
    title: "Tenant Data Model, Domain Layer and D1 Schema",
    shortTitle: "Tenant Domain Model",
    category: "Domain",
    href: "/docs/phase-wise/Phase04_tenant_domain_model.html",
    icon: Database,
    lead: "Model family accounts, customers, measurements, order items, production states, payments, receipts, and immutable audit records.",
    outcome:
      "A domain layer that protects historical measurements, order snapshots, financial corrections, and tenant-local invariants.",
    gate: "Repositories and services enforce IDs, snapshots, status rules, payment auditability, and failure handling.",
    tags: ["Domain invariants", "D1 schema", "Audit"],
  },
  {
    number: "05",
    title: "TailorOS Core Modules Implementation",
    shortTitle: "Core Modules",
    category: "Pilot product",
    href: "/docs/phase-wise/Phase05_tailoros_core_modules.html",
    icon: Layers3,
    lead: "Build the pilot-ready shop OS: dashboard, search, family profiles, measurements, orders, production board, payments, receipts, reports, and settings.",
    outcome:
      "A one-shop pilot can run daily counter and production workflows without falling back to notebooks.",
    gate: "E2E journeys cover walk-in order, repeat family customer, production progress, payment close, and receipt sharing.",
    tags: ["Dashboard", "Orders", "Payments"],
  },
  {
    number: "06",
    title: "WhatsApp Connector Implementation",
    shortTitle: "WhatsApp Connector",
    category: "Messaging",
    href: "/docs/phase-wise/Phase06_whatsapp_connector.html",
    icon: MessageCircle,
    lead: "Build the reusable connector with Meta Cloud API first, provider adapters, templates, webhooks, queues, idempotency, and safe inbound flows.",
    outcome:
      "TailorOS can request business messages while the connector handles provider details, policy, and delivery evidence.",
    gate: "Outbound templates, webhook normalization, shared-mobile disambiguation, opt-outs, retries, and usage ledger are verified.",
    tags: ["Meta direct", "Templates", "Webhooks"],
  },
  {
    number: "07",
    title: "Global Search, Performance and Fast UX",
    shortTitle: "Search Performance",
    category: "Speed",
    href: "/docs/phase-wise/Phase07_global_search_performance.html",
    icon: Search,
    lead: "Make search and core navigation fast enough for busy counter work with tenant-local projections, indexes, FTS, and frontend discipline.",
    outcome:
      "Users can find customers, orders, receipts, balances, and active work without switching context.",
    gate: "Query budgets, index strategy, UI responsiveness, and performance tests meet the pilot-speed bar.",
    tags: ["FTS", "Indexes", "Fast UI"],
  },
  {
    number: "08",
    title: "Security, Privacy, RBAC and Tenant Isolation",
    shortTitle: "Security RBAC",
    category: "Trust",
    href: "/docs/phase-wise/Phase08_security_privacy_rbac.html",
    icon: LockKeyhole,
    lead: "Harden auth, permissions, tenant boundaries, secret handling, R2 media access, support access, public endpoints, and abuse controls.",
    outcome:
      "Owners, staff, tailors, and platform admins can operate with least privilege and clear audit evidence.",
    gate: "Permission matrix, tenant isolation tests, credential safety, support audit, and public endpoint defenses pass.",
    tags: ["RBAC", "Privacy", "Secrets"],
  },
  {
    number: "09",
    title: "Testing, Observability, QA and Release",
    shortTitle: "Testing Release",
    category: "Launch",
    href: "/docs/phase-wise/Phase09_testing_observability_release.html",
    icon: ClipboardCheck,
    lead: "Create the test pyramid, fixtures, Worker runtime coverage, E2E journeys, logs, metrics, alerts, CI gates, and runbooks.",
    outcome:
      "The first real shop launch has repeatable quality gates and support-ready operational visibility.",
    gate: "Release checklist, go-live checklist, monitoring, alert routing, rollback path, and support playbooks are complete.",
    tags: ["Vitest", "E2E", "Runbooks"],
  },
  {
    number: "10",
    title: "Scale, Reliability, Cost Controls and Future Roadmap",
    shortTitle: "Scale Roadmap",
    category: "Scale",
    href: "/docs/phase-wise/Phase10_scale_reliability_roadmap.html",
    icon: Gauge,
    lead: "Plan growth across tenant sharding, read projections, realtime chat, offline drafts, cost controls, backups, restore, and future escape hatches.",
    outcome:
      "The platform can evolve beyond the pilot without prematurely bloating v1 or locking into a brittle architecture.",
    gate: "Scale tests, cost limits, backup/restore, roadmap triggers, and future architecture decisions are explicit.",
    tags: ["Reliability", "Cost", "Roadmap"],
  },
];

export const sequence = [
  {
    label: "Foundation",
    range: "01-02",
    body: "Architecture and product language must come first because every later module inherits these boundaries.",
  },
  {
    label: "Tenancy and domain",
    range: "03-04",
    body: "Provisioning and data model work together: tenant creation is only useful if the tenant schema protects operational truth.",
  },
  {
    label: "Pilot product",
    range: "05",
    body: "The shop can run core work: customer lookup, measurements, orders, production, payments, receipts, and owner reports.",
  },
  {
    label: "Messaging",
    range: "06",
    body: "WhatsApp connects after the order, payment, status, and consent records are clean enough to trust.",
  },
  {
    label: "Hardening",
    range: "07-09",
    body: "Search speed, privacy, RBAC, tests, observability, release gates, and runbooks make the pilot supportable.",
  },
  {
    label: "Scale path",
    range: "10",
    body: "The roadmap captures growth decisions without pulling every future feature into v1.",
  },
];

export const qualityPrinciples = [
  {
    title: "SOLID boundaries",
    body: "Route, feature, service, repository, adapter, and domain responsibilities stay separate so each phase can evolve without hidden coupling.",
    icon: Boxes,
  },
  {
    title: "Tenant isolation by design",
    body: "The control plane, per-tenant D1 model, support access rules, and connector account mapping make data separation structural.",
    icon: ShieldCheck,
  },
  {
    title: "Historical truth",
    body: "Measurements, order snapshots, payments, receipts, production states, and notifications need immutable history where disputes can happen.",
    icon: FileText,
  },
  {
    title: "Operational reliability",
    body: "Idempotency, outbox records, queues, DLQ handling, retry policy, and audit trails prevent small edge cases from becoming launch failures.",
    icon: Settings2,
  },
];

export const sourceDocs: SourceDoc[] = [
  {
    title: "TailorOS Final PRD",
    href: "/docs/TailorOS_Final_PRD.html",
    kind: "Product PRD",
    note: "Shop OS scope, family-aware identity, workflows, milestones, launch metrics, and risk controls.",
  },
  {
    title: "WhatsApp Chat Connector Final PRD",
    href: "/docs/Whatsapp_Chat_Final_PRD.html",
    kind: "Connector PRD",
    note: "Reusable messaging boundary, Meta direct strategy, provider adapters, templates, webhooks, and usage ledger.",
  },
  {
    title: "Cloudflare Stack Implementation Guide",
    href: "/docs/tech-stack/TailorOS_CF_Stack_Implementation_Guide.html",
    kind: "Architecture guide",
    note: "Cloudflare-first deployment, D1, Workers, queues, observability, and operational constraints.",
  },
  {
    title: "Phase00 master source",
    href: "/docs/phase-wise/Phase00_master_index.html",
    kind: "Source HTML",
    note: "Original static master index converted into this premium app surface.",
  },
];
